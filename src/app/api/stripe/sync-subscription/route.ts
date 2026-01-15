import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUserId } from '@/lib/api-auth';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getAdminFirestore } from '@/firebase/admin';
import { buildSubscriptionData } from '@/lib/stripe-helpers';
import type { SubscriptionPlan, SubscriptionStatus } from '@/lib/subscription/types';

export const dynamic = 'force-dynamic';

async function syncSubscriptionFromStripe(
  userId: string,
  stripeSubscriptionId: string
): Promise<void> {
  const stripe = getStripeClient();
  const adminFirestore = getAdminFirestore();

  let stripeSubscription;
  try {
    stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string })?.code;
    console.error('Failed to retrieve Stripe subscription:', {
      userId,
      stripeSubscriptionId,
      error: errorMessage,
      code: errorCode,
    });
    throw new Error(
      `Failed to retrieve Stripe subscription ${stripeSubscriptionId} for user ${userId}: ${errorMessage}${errorCode ? ` (code: ${errorCode})` : ''}`
    );
  }

  const subscriptionData = buildSubscriptionData(stripeSubscription, userId, false);
  subscriptionData.userId = userId;

  await adminFirestore
    .collection('users')
    .doc(userId)
    .collection('subscription')
    .doc('status')
    .set(subscriptionData, { merge: true });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireAuthenticatedUserId(request);

    const adminFirestore = getAdminFirestore();
    const subscriptionDoc = await adminFirestore
      .collection('users')
      .doc(userId)
      .collection('subscription')
      .doc('status')
      .get();

    const stripeCustomerId = subscriptionDoc.data()?.stripeCustomerId as string | undefined;

    if (!stripeCustomerId) {
      console.info('User has no Stripe customer ID:', { userId });
      return NextResponse.json({ synced: false, reason: 'no_customer' });
    }

    const stripe = getStripeClient();
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 10,
    });

    const validStatuses = ['active', 'trialing', 'past_due'];
    const activeSubscription = subscriptions.data.find(
      sub => validStatuses.includes(sub.status)
    );

    if (!activeSubscription) {
      console.info('No active subscriptions found in Stripe, setting plan to free:', {
        userId,
        stripeCustomerId,
      });

      const adminFirestore = getAdminFirestore();
      await adminFirestore
        .collection('users')
        .doc(userId)
        .collection('subscription')
        .doc('status')
        .set(
          {
            plan: 'free' as SubscriptionPlan,
            status: 'canceled' as SubscriptionStatus,
            updatedAt: new Date(),
          },
          { merge: true }
        );

      return NextResponse.json({ synced: true, reason: 'no_active_subscription_set_to_free' });
    }

    await syncSubscriptionFromStripe(userId, activeSubscription.id);

    console.info('Subscription synced successfully:', {
      userId,
      subscriptionId: activeSubscription.id,
      priceId: activeSubscription.items.data[0]?.price?.id,
    });

    return NextResponse.json({
      synced: true,
      subscriptionId: activeSubscription.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Failed to sync subscription:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}

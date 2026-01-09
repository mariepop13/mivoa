import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAuthenticatedUserId } from '@/lib/api-auth';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getAdminFirestore } from '@/firebase/admin';
import { MILLISECONDS_PER_SECOND } from '@/lib/time-constants';
import type { SubscriptionPlan, SubscriptionStatus, BillingCycle } from '@/lib/subscription/types';

export const dynamic = 'force-dynamic';

function mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    unpaid: 'unpaid',
  };

  return statusMap[stripeStatus] || 'free';
}

function getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
  const priceIdMappings: Array<{ envKey: string; plan: SubscriptionPlan }> = [
    { envKey: 'STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD', plan: 'supporter' },
    { envKey: 'STRIPE_PRICE_ID_SUPPORTER_MONTHLY_CAD', plan: 'supporter' },
    { envKey: 'STRIPE_PRICE_ID_SUPPORTER_ANNUAL_USD', plan: 'supporter' },
    { envKey: 'STRIPE_PRICE_ID_SUPPORTER_ANNUAL_CAD', plan: 'supporter' },
    { envKey: 'STRIPE_PRICE_ID_PRO_MONTHLY_USD', plan: 'pro' },
    { envKey: 'STRIPE_PRICE_ID_PRO_MONTHLY_CAD', plan: 'pro' },
    { envKey: 'STRIPE_PRICE_ID_PRO_ANNUAL_USD', plan: 'pro' },
    { envKey: 'STRIPE_PRICE_ID_PRO_ANNUAL_CAD', plan: 'pro' },
  ];

  for (const mapping of priceIdMappings) {
    if (process.env[mapping.envKey] === priceId) {
      return mapping.plan;
    }
  }

  return null;
}

function mapStripePlanToSubscriptionPlan(priceId: string, metadata?: Stripe.Metadata): SubscriptionPlan {
  if (metadata?.planId) {
    const planId = metadata.planId;
    if (planId === 'supporter' || planId === 'pro') {
      return planId;
    }
  }

  const planFromPriceId = getPlanFromPriceId(priceId);
  if (planFromPriceId) {
    return planFromPriceId;
  }

  console.warn('Could not determine plan from price ID or metadata:', {
    priceId,
    metadata,
  });

  return 'free';
}

function mapStripeBillingCycle(interval: string | null | undefined): BillingCycle | null {
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'annual';
  return null;
}

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

  const priceId = stripeSubscription.items.data[0]?.price.id || '';
  const plan = mapStripePlanToSubscriptionPlan(priceId, stripeSubscription.metadata);
  const status = mapStripeStatusToSubscriptionStatus(stripeSubscription.status);
  const billingCycle = mapStripeBillingCycle(
    stripeSubscription.items.data[0]?.price.recurring?.interval
  );

  console.info('Mapping subscription plan:', {
    priceId,
    metadata: stripeSubscription.metadata,
    determinedPlan: plan,
    envSupporterMonthlyUsd: process.env.STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD,
  });

  const subscriptionData: Record<string, unknown> = {
    userId,
    plan,
    status,
    stripeCustomerId: stripeSubscription.customer as string,
    stripeSubscriptionId: stripeSubscription.id,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    updatedAt: new Date(),
  };

  if (billingCycle) {
    subscriptionData.billingCycle = billingCycle;
  }

  if (stripeSubscription.current_period_start) {
    subscriptionData.currentPeriodStart = new Date(stripeSubscription.current_period_start * MILLISECONDS_PER_SECOND);
  }

  if (stripeSubscription.current_period_end) {
    subscriptionData.currentPeriodEnd = new Date(stripeSubscription.current_period_end * MILLISECONDS_PER_SECOND);
  }

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
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
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

    const subscription = subscriptions.data[0];
    await syncSubscriptionFromStripe(userId, subscription.id);

    console.info('Subscription synced successfully:', {
      userId,
      subscriptionId: subscription.id,
      priceId: subscription.items.data[0]?.price?.id,
    });

    return NextResponse.json({
      synced: true,
      subscriptionId: subscription.id,
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

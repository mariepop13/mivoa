import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getAdminFirestore } from '@/firebase/admin';
import type { SubscriptionPlan, SubscriptionStatus, BillingCycle } from '@/lib/subscription/types';

export const dynamic = 'force-dynamic';

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }
  return secret;
}

function mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
  };

  return statusMap[stripeStatus] || 'free';
}

function mapStripePlanToSubscriptionPlan(_priceId: string, metadata?: Stripe.Metadata): SubscriptionPlan {
  if (metadata?.planId) {
    const planId = metadata.planId;
    if (planId === 'basic' || planId === 'pro') {
      return planId;
    }
  }

  return 'basic';
}

function mapStripeBillingCycle(interval: string | null | undefined): BillingCycle | null {
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'annual';
  return null;
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const adminFirestore = getAdminFirestore();
  const userId = subscription.metadata?.userId;

  if (!userId) {
    return;
  }

  const plan = mapStripePlanToSubscriptionPlan(subscription.items.data[0]?.price.id || '', subscription.metadata);
  const status = mapStripeStatusToSubscriptionStatus(subscription.status);
  const billingCycle = mapStripeBillingCycle(subscription.items.data[0]?.price.recurring?.interval);

  const subscriptionData = {
    userId,
    plan,
    status,
    billingCycle: billingCycle || undefined,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : undefined,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : undefined,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await adminFirestore
    .collection('users')
    .doc(userId)
    .collection('subscription')
    .doc('status')
    .set(subscriptionData, { merge: false });

}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const adminFirestore = getAdminFirestore();
  const userId = subscription.metadata?.userId;

  if (!userId) {
    return;
  }

  const plan = mapStripePlanToSubscriptionPlan(subscription.items.data[0]?.price.id || '', subscription.metadata);
  const status = mapStripeStatusToSubscriptionStatus(subscription.status);
  const billingCycle = mapStripeBillingCycle(subscription.items.data[0]?.price.recurring?.interval);

  const updateData = {
    plan,
    status,
    billingCycle: billingCycle || undefined,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : undefined,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : undefined,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: new Date(),
  };

  await adminFirestore
    .collection('users')
    .doc(userId)
    .collection('subscription')
    .doc('status')
    .update(updateData);

}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const adminFirestore = getAdminFirestore();
  const userId = subscription.metadata?.userId;

  if (!userId) {
    return;
  }

  const updateData = {
    status: 'canceled' as SubscriptionStatus,
    cancelAtPeriodEnd: false,
    updatedAt: new Date(),
  };

  await adminFirestore
    .collection('users')
    .doc(userId)
    .collection('subscription')
    .doc('status')
    .update(updateData);

}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    const webhookSecret = getWebhookSecret();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

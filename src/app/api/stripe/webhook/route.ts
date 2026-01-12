import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getAdminFirestore } from '@/firebase/admin';
import {
  mapStripeStatusToSubscriptionStatus,
  mapStripePlanToSubscriptionPlan,
  mapStripeBillingCycle,
  buildSubscriptionData,
} from '@/lib/stripe-helpers';
import type { SubscriptionPlan, SubscriptionStatus, BillingCycle } from '@/lib/subscription/types';

export const dynamic = 'force-dynamic';

async function getUserIdFromSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<string | null> {
  const userId = subscription.metadata?.userId;
  if (userId) {
    return userId;
  }

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted && 'metadata' in customer) {
      return customer.metadata?.userId || null;
    }
  } catch (error) {
    console.error('Failed to retrieve customer for webhook:', {
      customerId,
      subscriptionId: subscription.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return null;
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }
  return secret;
}

async function handleSubscriptionCreated(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = await getUserIdFromSubscription(stripe, subscription);
  if (!userId) {
    throw new Error('Missing userId in subscription or customer metadata');
  }

  const adminFirestore = getAdminFirestore();
  const subscriptionData = buildSubscriptionData(subscription, userId, true);

  await adminFirestore
    .collection('users')
    .doc(userId)
    .collection('subscription')
    .doc('status')
    .set(subscriptionData, { merge: true });
}

async function handleSubscriptionUpdated(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = await getUserIdFromSubscription(stripe, subscription);
  if (!userId) {
    throw new Error('Missing userId in subscription or customer metadata');
  }

  const adminFirestore = getAdminFirestore();
  const updateData = buildSubscriptionData(subscription, userId, false);

  await adminFirestore
    .collection('users')
    .doc(userId)
    .collection('subscription')
    .doc('status')
    .set(updateData, { merge: true });
}

async function handleSubscriptionDeleted(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = await getUserIdFromSubscription(stripe, subscription);
  if (!userId) {
    throw new Error('Missing userId in subscription or customer metadata');
  }

  const adminFirestore = getAdminFirestore();

  const updateData = {
    plan: 'free' as SubscriptionPlan,
    status: 'canceled' as SubscriptionStatus,
    cancelAtPeriodEnd: false,
    updatedAt: new Date(),
  };

  await adminFirestore
    .collection('users')
    .doc(userId)
    .collection('subscription')
    .doc('status')
    .set(updateData, { merge: true });

}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  let event: Stripe.Event;
  const stripe = getStripeClient();

  try {
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
        await handleSubscriptionCreated(stripe, subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(stripe, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(stripe, subscription);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    if (error instanceof Error && error.message.includes('Missing userId')) {
      const subscription = (event.data.object as Stripe.Subscription) || {};
      const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id || 'unknown';
      
      console.error('Webhook missing userId:', {
        subscriptionId: subscription.id,
        customerId,
        eventType: event.type,
      });
      
      return NextResponse.json(
        { error: 'Missing userId in subscription or customer metadata' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

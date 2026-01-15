import Stripe from 'stripe';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getPriceId } from '@/lib/subscription/constants';
import { getAdminFirestore } from '@/firebase/admin';
import type { SubscriptionPlan, BillingCycle, Currency, SubscriptionData, SubscriptionStatus } from '@/lib/subscription/types';

const MILLISECONDS_PER_SECOND = 1000;

export function mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    unpaid: 'unpaid',
    paused: 'paused',
  };
  return statusMap[stripeStatus] || 'free';
}

export function getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
  const priceIdMappings = [
    { envKey: 'STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD', plan: 'supporter' as const },
    { envKey: 'STRIPE_PRICE_ID_SUPPORTER_MONTHLY_CAD', plan: 'supporter' as const },
    { envKey: 'STRIPE_PRICE_ID_SUPPORTER_ANNUAL_USD', plan: 'supporter' as const },
    { envKey: 'STRIPE_PRICE_ID_SUPPORTER_ANNUAL_CAD', plan: 'supporter' as const },
    { envKey: 'STRIPE_PRICE_ID_PRO_MONTHLY_USD', plan: 'pro' as const },
    { envKey: 'STRIPE_PRICE_ID_PRO_MONTHLY_CAD', plan: 'pro' as const },
    { envKey: 'STRIPE_PRICE_ID_PRO_ANNUAL_USD', plan: 'pro' as const },
    { envKey: 'STRIPE_PRICE_ID_PRO_ANNUAL_CAD', plan: 'pro' as const },
  ];

  for (const mapping of priceIdMappings) {
    if (process.env[mapping.envKey] === priceId) {
      return mapping.plan;
    }
  }
  return null;
}

export function mapStripePlanToSubscriptionPlan(
  priceId: string,
  metadata?: Stripe.Metadata
): SubscriptionPlan {
  if (metadata?.planId === 'supporter' || metadata?.planId === 'pro') {
    return metadata.planId;
  }
  return getPlanFromPriceId(priceId) ?? 'free';
}

export function mapStripeBillingCycle(interval: string | null | undefined): BillingCycle | null {
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'annual';
  return null;
}

export function buildSubscriptionData(
  subscription: Stripe.Subscription,
  userId: string,
  isCreation: boolean = false
): Record<string, unknown> {
  const priceItem = subscription.items.data[0];
  if (!priceItem) {
    throw new Error('Subscription has no price items');
  }

  const priceId = priceItem.price.id;
  const plan = mapStripePlanToSubscriptionPlan(priceId, subscription.metadata);
  const status = mapStripeStatusToSubscriptionStatus(subscription.status);
  const billingCycle = mapStripeBillingCycle(priceItem.price.recurring?.interval);

  const data: Record<string, unknown> = {
    plan,
    status,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: new Date(),
  };

  if (isCreation) {
    data.userId = userId;
    data.createdAt = new Date();
  }

  if (billingCycle) {
    data.billingCycle = billingCycle;
  }

  if (subscription.current_period_start) {
    data.currentPeriodStart = new Date(subscription.current_period_start * MILLISECONDS_PER_SECOND);
  }

  if (subscription.current_period_end) {
    data.currentPeriodEnd = new Date(subscription.current_period_end * MILLISECONDS_PER_SECOND);
  }

  return data;
}

async function updateUserStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  const adminFirestore = getAdminFirestore();
  const subscriptionRef = adminFirestore
    .collection('users')
    .doc(userId)
    .collection('subscription')
    .doc('status');

  await subscriptionRef.set(
    { stripeCustomerId, plan: 'free', status: 'active' },
    { merge: true }
  );
}

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string | null | undefined
): Promise<Stripe.Customer> {
  const stripe = getStripeClient();
  const adminFirestore = getAdminFirestore();

  const subscriptionRef = adminFirestore
    .collection('users')
    .doc(userId)
    .collection('subscription')
    .doc('status');

  const subscriptionSnap = await subscriptionRef.get();

  if (subscriptionSnap.exists) {
    const subscriptionData = subscriptionSnap.data();
    const existingCustomerId = subscriptionData?.stripeCustomerId as string | undefined;

    if (existingCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(existingCustomerId);
        if (customer && !customer.deleted) {
          return customer as Stripe.Customer;
        }
        console.warn('Customer was deleted in Stripe, clearing from Firestore:', {
          userId,
          existingCustomerId,
        });
        await subscriptionRef.set({ stripeCustomerId: null }, { merge: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = (error as { code?: string })?.code;
        console.warn('Customer not found in Stripe, clearing from Firestore:', {
          userId,
          existingCustomerId,
          error: errorMessage,
          code: errorCode,
        });
        await subscriptionRef.set({ stripeCustomerId: null }, { merge: true });
      }
    }
  }

  if (email) {
    try {
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        await updateUserStripeCustomerId(userId, customer.id);
        return customer;
      }
    } catch (error) {
      console.warn('Failed to search customers by email, creating new one:', {
        userId,
        email,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: {
      userId,
    },
  });

  await updateUserStripeCustomerId(userId, customer.id);
  return customer;
}

export function getStripePriceId(
  plan: SubscriptionPlan,
  cycle: BillingCycle,
  currency: Currency = 'USD'
): string {
  if (plan === 'free') {
    throw new Error('Free plan does not have a Stripe price ID');
  }

  return getPriceId(plan, cycle, currency);
}

export function formatSubscriptionResponse(
  data: SubscriptionData
): {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
} {
  const formatDate = (date: Date | undefined | null): string | null => {
    if (!date) return null;
    return date.toISOString();
  };

  return {
    plan: data.plan,
    status: data.status,
    billingCycle: data.billingCycle ?? null,
    currentPeriodStart: formatDate(data.currentPeriodStart),
    currentPeriodEnd: formatDate(data.currentPeriodEnd),
    cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
  };
}

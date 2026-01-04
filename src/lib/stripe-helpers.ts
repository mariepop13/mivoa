import Stripe from 'stripe';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getPriceId } from '@/lib/subscription/constants';
import type { SubscriptionPlan, BillingCycle, Currency, SubscriptionData, SubscriptionStatus } from '@/lib/subscription/types';

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string | null | undefined
): Promise<Stripe.Customer> {
  const stripe = getStripeClient();

  const existingCustomers = await stripe.customers.list({
    email: email || undefined,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: {
      userId,
    },
  });

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


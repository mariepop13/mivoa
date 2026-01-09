import Stripe from 'stripe';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getPriceId } from '@/lib/subscription/constants';
import { getAdminFirestore } from '@/firebase/admin';
import type { SubscriptionPlan, BillingCycle, Currency, SubscriptionData, SubscriptionStatus } from '@/lib/subscription/types';

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

  const subscriptionSnap = await subscriptionRef.get();

  if (subscriptionSnap.exists) {
    await subscriptionRef.update({
      stripeCustomerId,
    });
  } else {
    await subscriptionRef.set({
      plan: 'free',
      status: 'active',
      stripeCustomerId,
    });
  }
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
        console.info('Customer was deleted in Stripe, creating new one:', {
          userId,
          existingCustomerId,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = (error as { code?: string })?.code;
        console.info('Customer not found in Stripe, creating new one:', {
          userId,
          existingCustomerId,
          error: errorMessage,
          code: errorCode,
        });
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

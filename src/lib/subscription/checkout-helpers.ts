import Stripe from 'stripe';
import { getStripeClient } from './stripe-client';
import { getStripePriceId } from '@/lib/stripe-helpers';
import { validatePlanId, validateBillingCycle } from './subscription-service';
import type { Currency, BillingCycle, SubscriptionPlan } from './types';

export interface CheckoutRequest {
  planId: string;
  billingCycle: string;
  currency?: string;
}

export interface ValidationResult {
  success: boolean;
  priceId?: string;
  planId?: SubscriptionPlan;
  billingCycle?: BillingCycle;
  currency?: Currency;
  error?: string;
}

function validateCurrency(currency: string): Currency | null {
  const validCurrencies: Currency[] = ['USD', 'CAD'];
  const currencyUpper = currency.toUpperCase() as Currency;
  return validCurrencies.includes(currencyUpper) ? currencyUpper : null;
}

export function validateCheckoutRequest(
  body: CheckoutRequest,
  authenticatedUserId: string | null
): ValidationResult {
  if (!authenticatedUserId) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  if (!body.planId || typeof body.planId !== 'string') {
    return {
      success: false,
      error: 'planId is required',
    };
  }

  if (!body.billingCycle || typeof body.billingCycle !== 'string') {
    return {
      success: false,
      error: 'billingCycle is required',
    };
  }

  if (!validatePlanId(body.planId)) {
    return {
      success: false,
      error: 'Invalid planId. Must be "basic" or "pro"',
    };
  }

  if (!validateBillingCycle(body.billingCycle)) {
    return {
      success: false,
      error: 'Invalid billingCycle. Must be "monthly" or "annual"',
    };
  }

  const currency = body.currency || 'USD';
  const validCurrency = validateCurrency(currency);
  if (!validCurrency) {
    return {
      success: false,
      error: 'Invalid currency. Must be "USD" or "CAD"',
    };
  }

  try {
    const priceId = getStripePriceId(
      body.planId as 'basic' | 'pro',
      body.billingCycle as BillingCycle,
      validCurrency
    );

    return {
      success: true,
      priceId,
      planId: body.planId as SubscriptionPlan,
      billingCycle: body.billingCycle as BillingCycle,
      currency: validCurrency,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get price ID',
    };
  }
}

export interface CreateCheckoutSessionParams {
  customer: Stripe.Customer;
  priceId: string;
  userId: string;
  planId: string;
  billingCycle: string;
  origin: string;
}

export async function createStripeCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<string> {
  const stripe = getStripeClient();
  const successUrl = `${params.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${params.origin}/subscription/cancel`;

  const session = await stripe.checkout.sessions.create({
    customer: params.customer.id,
    mode: 'subscription',
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: params.userId,
      planId: params.planId,
      billingCycle: params.billingCycle,
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
        planId: params.planId,
      },
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return session.url;
}


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

function validateAuth(authenticatedUserId: string | null): ValidationResult | null {
  if (!authenticatedUserId) {
    return { success: false, error: 'Unauthorized' };
  }
  return null;
}

function validatePlanIdField(planId: unknown): ValidationResult | null {
  if (!planId || typeof planId !== 'string') {
    return { success: false, error: 'planId is required' };
  }
  if (!validatePlanId(planId)) {
    return { success: false, error: 'Invalid planId. Must be "supporter" or "pro"' };
  }
  return null;
}

function validateBillingCycleField(billingCycle: unknown): ValidationResult | null {
  if (!billingCycle || typeof billingCycle !== 'string') {
    return { success: false, error: 'billingCycle is required' };
  }
  if (!validateBillingCycle(billingCycle)) {
    return { success: false, error: 'Invalid billingCycle. Must be "monthly" or "annual"' };
  }
  return null;
}

function validateCurrencyField(currency: string | undefined): { currency: Currency } | ValidationResult {
  const defaultCurrency = currency || 'USD';
  const validCurrency = validateCurrency(defaultCurrency);
  if (!validCurrency) {
    return { success: false, error: 'Invalid currency. Must be "USD" or "CAD"' };
  }
  return { currency: validCurrency };
}

export function validateCheckoutRequest(
  body: CheckoutRequest,
  authenticatedUserId: string | null
): ValidationResult {
  const authError = validateAuth(authenticatedUserId);
  if (authError) return authError;

  const planIdError = validatePlanIdField(body.planId);
  if (planIdError) return planIdError;

  const billingCycleError = validateBillingCycleField(body.billingCycle);
  if (billingCycleError) return billingCycleError;

  const currencyResult = validateCurrencyField(body.currency);
  if (!('currency' in currencyResult)) return currencyResult;

  try {
    const priceId = getStripePriceId(
      body.planId as 'supporter' | 'pro',
      body.billingCycle as BillingCycle,
      currencyResult.currency
    );

    return {
      success: true,
      priceId,
      planId: body.planId as SubscriptionPlan,
      billingCycle: body.billingCycle as BillingCycle,
      currency: currencyResult.currency,
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


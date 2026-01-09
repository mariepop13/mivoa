import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAuthenticatedUserId } from '@/lib/api-auth';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getOrCreateStripeCustomer, getStripePriceId } from '@/lib/stripe-helpers';
import { validatePlanId, validateBillingCycle } from '@/lib/subscription/subscription-service';
import { getAdminAuth } from '@/firebase/admin';
import type { Currency, BillingCycle } from '@/lib/subscription/types';

export const dynamic = 'force-dynamic';

interface CreateCheckoutRequest {
  planId: string;
  billingCycle: string;
  currency?: string;
}

function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function validateCurrency(currency: string): Currency | null {
  const validCurrencies: Currency[] = ['USD', 'CAD'];
  const currencyUpper = currency.toUpperCase() as Currency;
  return validCurrencies.includes(currencyUpper) ? currencyUpper : null;
}

function validateCheckoutInput(body: CreateCheckoutRequest): NextResponse | null {
  if (!body.planId || typeof body.planId !== 'string') {
    return createErrorResponse('planId is required', 400);
  }

  if (!body.billingCycle || typeof body.billingCycle !== 'string') {
    return createErrorResponse('billingCycle is required', 400);
  }

  if (!validatePlanId(body.planId)) {
    return createErrorResponse('Invalid planId. Must be "supporter" or "pro"', 400);
  }

  if (!validateBillingCycle(body.billingCycle)) {
    return createErrorResponse('Invalid billingCycle. Must be "monthly" or "annual"', 400);
  }

  const currency = body.currency || 'USD';
  const validCurrency = validateCurrency(currency);
  if (!validCurrency) {
    return createErrorResponse('Invalid currency. Must be "USD" or "CAD"', 400);
  }

  return null;
}

async function createCheckoutSession(
  customer: Stripe.Customer,
  priceId: string,
  userId: string,
  planId: string,
  billingCycle: string,
  baseUrl: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  const successUrl = `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/subscription/cancel`;

  return await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planId,
      billingCycle,
    },
    subscription_data: {
      metadata: {
        userId,
        planId,
      },
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireAuthenticatedUserId(request);
    const body: CreateCheckoutRequest = await request.json();

    const validationError = validateCheckoutInput(body);
    if (validationError) {
      return validationError;
    }

    const currency = validateCurrency(body.currency || 'USD')!;
    const adminAuth = getAdminAuth();
    const userRecord = await adminAuth.getUser(userId);
    const customer = await getOrCreateStripeCustomer(userId, userRecord.email);
    const priceId = getStripePriceId(body.planId as 'supporter' | 'pro', body.billingCycle as BillingCycle, currency);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    console.log('Creating checkout session:', {
      userId,
      planId: body.planId,
      billingCycle: body.billingCycle,
      currency,
      priceId,
      customerId: customer.id,
    });

    const session = await createCheckoutSession(customer, priceId, userId, body.planId, body.billingCycle, baseUrl);

    if (!session.url) {
      console.error('Checkout session created but URL is missing:', { sessionId: session.id });
      return createErrorResponse('Failed to create checkout session', 500);
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    console.error('Failed to create checkout session:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: request.body ? 'present' : 'missing',
    });
    return createErrorResponse('Internal server error', 500);
  }
}

import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireAuthenticatedUserId();

    const body: CreateCheckoutRequest = await request.json();
    const { planId, billingCycle, currency = 'USD' } = body;

    if (!planId || typeof planId !== 'string') {
      return createErrorResponse('planId is required', 400);
    }

    if (!billingCycle || typeof billingCycle !== 'string') {
      return createErrorResponse('billingCycle is required', 400);
    }

    if (!validatePlanId(planId)) {
      return createErrorResponse('Invalid planId. Must be "basic" or "pro"', 400);
    }

    if (!validateBillingCycle(billingCycle)) {
      return createErrorResponse('Invalid billingCycle. Must be "monthly" or "annual"', 400);
    }

    if (planId === 'free') {
      return createErrorResponse('Cannot create checkout for free plan', 400);
    }

    const validCurrencies: Currency[] = ['USD', 'CAD'];
    const currencyUpper = currency.toUpperCase() as Currency;
    if (!validCurrencies.includes(currencyUpper)) {
      return createErrorResponse('Invalid currency. Must be "USD" or "CAD"', 400);
    }

    const stripe = getStripeClient();
    const adminAuth = getAdminAuth();
    const userRecord = await adminAuth.getUser(userId);

    const customer = await getOrCreateStripeCustomer(userId, userRecord.email);

    const priceId = getStripePriceId(planId as 'basic' | 'pro', billingCycle as BillingCycle, currencyUpper);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const successUrl = `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/subscription/cancel`;

    const session = await stripe.checkout.sessions.create({
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

    if (!session.url) {
      return createErrorResponse('Failed to create checkout session', 500);
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    console.error('Failed to create checkout session:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

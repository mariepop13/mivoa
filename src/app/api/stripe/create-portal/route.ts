import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUserId } from '@/lib/api-auth';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getAdminFirestore } from '@/firebase/admin';
import type { SubscriptionData } from '@/lib/subscription/types';

export const dynamic = 'force-dynamic';

function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
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

    if (!subscriptionDoc.exists) {
      return createErrorResponse('No subscription found', 404);
    }

    const subscriptionData = subscriptionDoc.data() as SubscriptionData;
    const { stripeCustomerId } = subscriptionData;

    if (!stripeCustomerId) {
      return createErrorResponse('No Stripe customer ID found', 404);
    }

    const stripe = getStripeClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const returnUrl = `${baseUrl}/subscription`;

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    console.error('Failed to create portal session:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

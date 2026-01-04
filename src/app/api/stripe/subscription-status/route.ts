import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUserId } from '@/lib/api-auth';
import { getAdminFirestore } from '@/firebase/admin';
import { formatSubscriptionResponse } from '@/lib/stripe-helpers';
import type { SubscriptionData, SubscriptionPlan, SubscriptionStatus, BillingCycle } from '@/lib/subscription/types';

export const dynamic = 'force-dynamic';

function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function buildFreeSubscriptionResponse(): NextResponse {
  return NextResponse.json(
    {
      plan: 'free' as const,
      status: 'free' as const,
      billingCycle: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    }
  );
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireAuthenticatedUserId();

    const adminFirestore = getAdminFirestore();
    const subscriptionDoc = await adminFirestore
      .collection('users')
      .doc(userId)
      .collection('subscription')
      .doc('status')
      .get();

    if (!subscriptionDoc.exists) {
      return buildFreeSubscriptionResponse();
    }

    const rawData = subscriptionDoc.data();
    if (!rawData) {
      return buildFreeSubscriptionResponse();
    }

    const subscriptionData: SubscriptionData = {
      userId,
      plan: (rawData.plan as SubscriptionPlan) || 'free',
      status: (rawData.status as SubscriptionStatus) || 'free',
      stripeCustomerId: rawData.stripeCustomerId as string | undefined,
      stripeSubscriptionId: rawData.stripeSubscriptionId as string | undefined,
      stripePriceId: rawData.stripePriceId as string | undefined,
      currentPeriodStart: rawData.currentPeriodStart
        ? (rawData.currentPeriodStart as { toDate: () => Date }).toDate()
        : undefined,
      currentPeriodEnd: rawData.currentPeriodEnd
        ? (rawData.currentPeriodEnd as { toDate: () => Date }).toDate()
        : undefined,
      cancelAtPeriodEnd: rawData.cancelAtPeriodEnd as boolean | undefined,
      canceledAt: rawData.canceledAt
        ? (rawData.canceledAt as { toDate: () => Date }).toDate()
        : undefined,
      trialEnd: rawData.trialEnd
        ? (rawData.trialEnd as { toDate: () => Date }).toDate()
        : undefined,
      billingCycle: rawData.billingCycle as BillingCycle | undefined,
      createdAt: rawData.createdAt
        ? (rawData.createdAt as { toDate: () => Date }).toDate()
        : new Date(),
      updatedAt: rawData.updatedAt
        ? (rawData.updatedAt as { toDate: () => Date }).toDate()
        : new Date(),
    };
    const response = formatSubscriptionResponse(subscriptionData);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    console.error('Failed to get subscription status:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

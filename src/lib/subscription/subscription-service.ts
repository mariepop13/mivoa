import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionData,
  SubscriptionWithUsage,
  PlanLimits,
  UsageStats,
} from './types';
import { PLAN_LIMITS, SUBSCRIPTION_PLANS, UNLIMITED_ENTRIES } from './constants';

const FIRESTORE_SUBSCRIPTION_PATH = 'subscription/status';

export async function fetchSubscription(
  userId: string
): Promise<SubscriptionData | null> {
  const { firestore } = initializeFirebase();
  const subscriptionRef = doc(
    firestore,
    `users/${userId}/${FIRESTORE_SUBSCRIPTION_PATH}`
  );

  const subscriptionSnap = await getDoc(subscriptionRef);

  if (!subscriptionSnap.exists()) {
    return null;
  }

  const data = subscriptionSnap.data();
  return transformFirestoreData(userId, data);
}

export function validateSubscription(
  subscription: SubscriptionData | null
): subscription is SubscriptionData {
  if (!subscription) {
    return false;
  }

  if (!SUBSCRIPTION_PLANS.includes(subscription.plan)) {
    return false;
  }

  if (!VALID_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
    return false;
  }

  if (subscription.status === 'active' && !subscription.stripeSubscriptionId) {
    return false;
  }

  return true;
}

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function calculateUsageResetDate(
  lastReset: Date | null
): { lastResetDate: Date; nextResetDate: Date } {
  const now = new Date();
  const currentMonth = new Date(now);
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const lastResetDate = lastReset || currentMonth;

  const nextReset = new Date(currentMonth);
  nextReset.setMonth(nextReset.getMonth() + 1);
  nextReset.setHours(0, 0, 0, 0);

  if (lastReset && lastReset > currentMonth) {
    const lastResetNextMonth = new Date(lastReset);
    lastResetNextMonth.setMonth(lastResetNextMonth.getMonth() + 1);
    lastResetNextMonth.setDate(1);
    lastResetNextMonth.setHours(0, 0, 0, 0);

    if (lastResetNextMonth > nextReset) {
      return {
        lastResetDate,
        nextResetDate: lastResetNextMonth,
      };
    }
  }

  return {
    lastResetDate,
    nextResetDate: nextReset,
  };
}

export function getDefaultSubscription(userId: string): SubscriptionData {
  return {
    userId,
    plan: 'free',
    status: 'free',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getSubscriptionWithUsage(
  userId: string
): Promise<SubscriptionWithUsage> {
  let subscription = await fetchSubscription(userId);

  if (!subscription || !validateSubscription(subscription)) {
    subscription = getDefaultSubscription(userId);
  }

  const limits = getPlanLimits(subscription.plan);
  const usage = await getUsageStats(userId, subscription.plan);

  return {
    ...subscription,
    limits,
    usage,
  };
}

function buildDefaultUsageStats(entriesPerMonth: number): UsageStats {
  const { lastResetDate, nextResetDate } = calculateUsageResetDate(null);
  return {
    entriesUsed: 0,
    entriesLimit: entriesPerMonth === UNLIMITED_ENTRIES ? Infinity : entriesPerMonth,
    lastResetDate,
    nextResetDate,
    modelUsage: {},
  };
}

function buildUsageStatsFromData(
  data: Record<string, unknown>,
  entriesPerMonth: number
): UsageStats {
  const lastResetDateField = data.lastResetDate as { toDate?: () => Date } | undefined;
  const lastReset = lastResetDateField?.toDate?.() || null;
  const { lastResetDate, nextResetDate } = calculateUsageResetDate(lastReset);

  return {
    entriesUsed: (data.entriesUsed as number | undefined) || 0,
    entriesLimit: entriesPerMonth === UNLIMITED_ENTRIES ? Infinity : entriesPerMonth,
    lastResetDate,
    nextResetDate,
    modelUsage: (data.modelUsage as Record<string, number> | undefined) || {},
  };
}

function logUsageStatsFetchError(
  userId: string,
  plan: SubscriptionPlan,
  error: unknown
): void {
  console.error('Failed to fetch usage stats from Firestore', {
    userId,
    plan,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

async function getUsageStats(
  userId: string,
  plan: SubscriptionPlan
): Promise<UsageStats> {
  const { firestore } = initializeFirebase();
  const usageRef = doc(firestore, `users/${userId}/subscription/usage`);
  const limits = getPlanLimits(plan);

  try {
    const usageSnap = await getDoc(usageRef);
    const data = usageSnap.data();

    if (!data) {
      return buildDefaultUsageStats(limits.entriesPerMonth);
    }

    return buildUsageStatsFromData(data, limits.entriesPerMonth);
  } catch (error) {
    logUsageStatsFetchError(userId, plan, error);
    return buildDefaultUsageStats(limits.entriesPerMonth);
  }
}

function transformFirestoreData(
  userId: string,
  data: Record<string, unknown>
): SubscriptionData {
  return {
    userId,
    plan: (data.plan as SubscriptionPlan) || 'free',
    status: (data.status as SubscriptionStatus) || 'free',
    stripeCustomerId: data.stripeCustomerId as string | undefined,
    stripeSubscriptionId: data.stripeSubscriptionId as string | undefined,
    stripePriceId: data.stripePriceId as string | undefined,
    currentPeriodStart: data.currentPeriodStart
      ? (data.currentPeriodStart as { toDate: () => Date }).toDate()
      : undefined,
    currentPeriodEnd: data.currentPeriodEnd
      ? (data.currentPeriodEnd as { toDate: () => Date }).toDate()
      : undefined,
    cancelAtPeriodEnd: data.cancelAtPeriodEnd as boolean | undefined,
    canceledAt: data.canceledAt
      ? (data.canceledAt as { toDate: () => Date }).toDate()
      : undefined,
    trialEnd: data.trialEnd
      ? (data.trialEnd as { toDate: () => Date }).toDate()
      : undefined,
    billingCycle: data.billingCycle as 'monthly' | 'annual' | undefined,
    createdAt: data.createdAt
      ? (data.createdAt as { toDate: () => Date }).toDate()
      : new Date(),
    updatedAt: data.updatedAt
      ? (data.updatedAt as { toDate: () => Date }).toDate()
      : new Date(),
  };
}

const VALID_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'free',
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
  'incomplete_expired',
  'unpaid',
];

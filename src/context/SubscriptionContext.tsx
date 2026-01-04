'use client';

import { createContext, ReactNode, useMemo, useContext, useCallback } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionData,
  PlanLimits,
  UsageStats,
} from '@/lib/subscription/types';
import {
  getDefaultSubscription,
  getPlanLimits,
  calculateUsageResetDate,
} from '@/lib/subscription/subscription-service';
import { PLAN_LIMITS, UNLIMITED_ENTRIES } from '@/lib/subscription/constants';

interface SubscriptionFirestoreData extends Record<string, unknown> {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart?: { toDate: () => Date };
  currentPeriodEnd?: { toDate: () => Date };
  cancelAtPeriodEnd?: boolean;
  canceledAt?: { toDate: () => Date };
  trialEnd?: { toDate: () => Date };
  billingCycle?: 'monthly' | 'annual';
  createdAt?: { toDate: () => Date };
  updatedAt?: { toDate: () => Date };
}

interface UsageFirestoreData extends Record<string, unknown> {
  entriesUsed?: number;
  lastResetDate?: { toDate: () => Date };
  modelUsage?: Record<string, number>;
}

export interface SubscriptionContextType {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  usage: UsageStats | null;
  limits: PlanLimits;
  isLoading: boolean;
  error: Error | null;
  refreshSubscription: () => Promise<void>;
  isPremium: boolean;
  isBasic: boolean;
  isPro: boolean;
}

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

function transformSubscriptionData(
  userId: string,
  data: SubscriptionFirestoreData | null
): SubscriptionData {
  if (!data) {
    return getDefaultSubscription(userId);
  }

  return {
    userId,
    plan: data.plan || 'free',
    status: data.status || 'free',
    stripeCustomerId: data.stripeCustomerId as string | undefined,
    stripeSubscriptionId: data.stripeSubscriptionId as string | undefined,
    stripePriceId: data.stripePriceId as string | undefined,
    currentPeriodStart: data.currentPeriodStart?.toDate(),
    currentPeriodEnd: data.currentPeriodEnd?.toDate(),
    cancelAtPeriodEnd: data.cancelAtPeriodEnd as boolean | undefined,
    canceledAt: data.canceledAt?.toDate(),
    trialEnd: data.trialEnd?.toDate(),
    billingCycle: data.billingCycle,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

function buildUsageStats(
  data: UsageFirestoreData | null,
  entriesPerMonth: number
): UsageStats {
  const lastResetDateField = data?.lastResetDate;
  const lastReset = lastResetDateField?.toDate?.() || null;
  const { lastResetDate, nextResetDate } = calculateUsageResetDate(lastReset);

  return {
    entriesUsed: data?.entriesUsed || 0,
    entriesLimit: entriesPerMonth === UNLIMITED_ENTRIES ? Infinity : entriesPerMonth,
    lastResetDate,
    nextResetDate,
    modelUsage: (data?.modelUsage as Record<string, number>) || {},
  };
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps): React.JSX.Element {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const subscriptionDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}/subscription/status`);
  }, [firestore, user]);

  const usageDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}/subscription/usage`);
  }, [firestore, user]);

  const { data: subscriptionData, isLoading: isSubscriptionLoading, error: subscriptionError } =
    useDoc<SubscriptionFirestoreData>(subscriptionDocRef);

  const { data: usageData, isLoading: isUsageLoading, error: usageError } =
    useDoc<UsageFirestoreData>(usageDocRef);

  const subscription = useMemo(() => {
    if (!user) {
      return null;
    }
    return transformSubscriptionData(user.uid, subscriptionData);
  }, [user, subscriptionData]);

  const plan = subscription?.plan || 'free';
  const status = subscription?.status || 'free';
  const limits = useMemo(() => getPlanLimits(plan), [plan]);

  const usage = useMemo(() => {
    if (!user) {
      return null;
    }
    return buildUsageStats(usageData, limits.entriesPerMonth);
  }, [user, usageData, limits.entriesPerMonth]);

  const isLoading = isUserLoading || isSubscriptionLoading || isUsageLoading;
  const error = subscriptionError || usageError || null;

  const isPremium = plan === 'pro';
  const isBasic = plan === 'basic';
  const isPro = plan === 'pro';

  const refreshSubscription = useCallback(async () => {
    // Real-time listener handles updates automatically
    // This function exists for API compatibility but doesn't need to do anything
    // since useDoc already provides real-time updates via onSnapshot
  }, []);

  const contextValue = useMemo<SubscriptionContextType>(
    () => ({
      plan,
      status,
      usage,
      limits,
      isLoading,
      error,
      refreshSubscription,
      isPremium,
      isBasic,
      isPro,
    }),
    [plan, status, usage, limits, isLoading, error, refreshSubscription, isPremium, isBasic, isPro]
  );

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}


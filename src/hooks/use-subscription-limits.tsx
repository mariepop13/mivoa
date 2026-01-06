'use client';

import { useMemo, useCallback } from 'react';
import { useUser } from '@/firebase';
import { useSubscription } from './use-subscription';
import { canCreateEntry } from '@/lib/subscription/feature-gate';
import { incrementEntryUsage, checkAndResetIfNeeded } from '@/lib/subscription/usage-tracker';

export interface UseSubscriptionLimitsReturn {
  canCreateEntry: boolean;
  entriesRemaining: number;
  entriesUsed: number;
  entriesLimit: number;
  isLoading: boolean;
  checkBeforeCreate: () => Promise<boolean>;
}

export function useSubscriptionLimits(): UseSubscriptionLimitsReturn {
  const { user } = useUser();
  const { plan, usage, limits, isLoading } = useSubscription();

  const entriesUsed = usage?.entriesUsed ?? 0;
  const entriesLimit = limits.entriesPerMonth === -1 ? Infinity : limits.entriesPerMonth;

  const canCreate = useMemo(() => {
    if (isLoading || !usage) {
      return false;
    }
    return canCreateEntry(plan, entriesUsed, limits.entriesPerMonth);
  }, [plan, entriesUsed, limits.entriesPerMonth, isLoading, usage]);

  const entriesRemaining = useMemo(() => {
    if (entriesLimit === Infinity) {
      return Infinity;
    }
    return Math.max(0, entriesLimit - entriesUsed);
  }, [entriesLimit, entriesUsed]);

  const checkBeforeCreate = useCallback(async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    if (!canCreate) {
      return false;
    }

    try {
      if (usage?.lastResetDate) {
        await checkAndResetIfNeeded(user.uid, usage.lastResetDate);
      }
      
      await incrementEntryUsage(user.uid);
      return true;
    } catch (error) {
      console.error('Failed to track entry usage:', error);
      return false;
    }
  }, [user, canCreate, usage?.lastResetDate]);

  return {
    canCreateEntry: canCreate,
    entriesRemaining,
    entriesUsed,
    entriesLimit,
    isLoading,
    checkBeforeCreate,
  };
}


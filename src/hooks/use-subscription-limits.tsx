'use client';

import { useMemo, useCallback } from 'react';
import { useUser } from '@/firebase';
import { useSubscription } from './use-subscription';
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
  const { usage, isLoading } = useSubscription();

  const entriesUsed = usage?.entriesUsed ?? 0;
  const entriesLimit = Infinity;

  const canCreate = useMemo(() => {
    if (isLoading) {
      return false;
    }
    return true;
  }, [isLoading]);

  const entriesRemaining = Infinity;

  const checkBeforeCreate = useCallback(async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const lastResetDate = usage?.lastResetDate;
      if (lastResetDate) {
        await checkAndResetIfNeeded(user.uid, lastResetDate);
      }
      
      await incrementEntryUsage(user.uid);
      return true;
    } catch (error) {
      console.error('Failed to track entry usage:', error);
      return false;
    }
  }, [user, usage]);

  return {
    canCreateEntry: canCreate,
    entriesRemaining,
    entriesUsed,
    entriesLimit,
    isLoading,
    checkBeforeCreate,
  };
}


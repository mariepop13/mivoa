'use client';

import { useContext } from 'react';
import { SubscriptionContext } from '@/context/SubscriptionContext';
import type { SubscriptionContextType } from '@/context/SubscriptionContext';

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }

  return context;
}


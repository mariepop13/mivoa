export type SubscriptionPlan = 'free' | 'basic' | 'pro';

export type SubscriptionStatus =
  | 'free'
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export type BillingCycle = 'monthly' | 'annual';

export interface PlanLimits {
  entriesPerMonth: number;
  modelsAccess: string[];
  exportEnabled: boolean;
  exportResolution: 'standard' | 'high';
  advancedAnalysis: boolean;
  customTemplates: boolean;
}

export interface UsageStats {
  entriesUsed: number;
  entriesLimit: number;
  lastResetDate: Date | null;
  nextResetDate: Date | null;
  modelUsage: Record<string, number>;
}

export interface SubscriptionData {
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  billingCycle?: BillingCycle;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionWithUsage extends SubscriptionData {
  usage: UsageStats;
  limits: PlanLimits;
}

export type Currency = 'USD' | 'CAD';

export interface CreateCheckoutSessionParams {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
}

export interface CreatePortalSessionParams {
  returnUrl: string;
  userId: string;
}


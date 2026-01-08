export type SubscriptionPlan = 'free' | 'supporter' | 'pro';

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
  advancedAnalysis: boolean;
  multiEntryAnalysis: boolean;
  periodSummary: boolean;
  exportPDF: boolean;
  exportBackup: boolean;
  customTemplates: boolean;
  semanticSearch: boolean;
}

export interface UsageStats {
  entriesUsed?: number;
  entriesLimit?: number;
  lastResetDate?: Date | null;
  nextResetDate?: Date | null;
  modelUsage?: Record<string, number>;
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

export interface CreatePortalSessionParams {
  returnUrl: string;
  userId: string;
}

export interface SupporterCosmetics {
  badge: boolean;
  accentColors: string[];
}


import type { SubscriptionPlan, PlanLimits, BillingCycle, Currency } from './types';

export const UNLIMITED_ENTRIES = -1;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ['free', 'basic', 'pro'];

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    entriesPerMonth: 10,
    modelsAccess: ['gpt-3.5-turbo', 'claude-3-haiku'],
    exportEnabled: false,
    exportResolution: 'standard',
    advancedAnalysis: false,
    customTemplates: false,
  },
  basic: {
    entriesPerMonth: 100,
    modelsAccess: [
      'gpt-3.5-turbo',
      'gpt-4o-mini',
      'claude-3-haiku',
      'claude-3-sonnet',
    ],
    exportEnabled: true,
    exportResolution: 'standard',
    advancedAnalysis: true,
    customTemplates: false,
  },
  pro: {
    entriesPerMonth: UNLIMITED_ENTRIES,
    modelsAccess: [
      'gpt-3.5-turbo',
      'gpt-4o-mini',
      'gpt-4o',
      'claude-3-haiku',
      'claude-3-sonnet',
      'claude-3.5-sonnet',
      'claude-3-opus',
    ],
    exportEnabled: true,
    exportResolution: 'high',
    advancedAnalysis: true,
    customTemplates: true,
  },
};

export const PLAN_PRICING: Record<
  SubscriptionPlan,
  Record<BillingCycle, Record<Currency, number>>
> = {
  free: {
    monthly: { USD: 0, CAD: 0 },
    annual: { USD: 0, CAD: 0 },
  },
  basic: {
    monthly: { USD: 990, CAD: 1390 },
    annual: { USD: 9900, CAD: 13900 },
  },
  pro: {
    monthly: { USD: 1990, CAD: 2790 },
    annual: { USD: 19900, CAD: 27900 },
  },
};

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  free: [
    '10 entries per month',
    'Basic AI models',
    'Basic mood/themes detection',
    'Standard journal features',
  ],
  basic: [
    '100 entries per month',
    'Enhanced AI models',
    'Enhanced analysis',
    'Export entries (standard resolution)',
    'Advanced mood/themes detection',
  ],
  pro: [
    'Unlimited entries',
    'All AI models',
    'Full analysis with all features',
    'Export entries (high resolution)',
    'Custom templates',
    'Priority support',
  ],
};

export const STRIPE_PRICE_ID_ENV_VARS: Record<
  SubscriptionPlan,
  Record<BillingCycle, Record<Currency, string>>
> = {
  free: {
    monthly: {
      USD: 'STRIPE_PRICE_ID_FREE_MONTHLY_USD',
      CAD: 'STRIPE_PRICE_ID_FREE_MONTHLY_CAD',
    },
    annual: {
      USD: 'STRIPE_PRICE_ID_FREE_ANNUAL_USD',
      CAD: 'STRIPE_PRICE_ID_FREE_ANNUAL_CAD',
    },
  },
  basic: {
    monthly: {
      USD: 'STRIPE_PRICE_ID_BASIC_MONTHLY_USD',
      CAD: 'STRIPE_PRICE_ID_BASIC_MONTHLY_CAD',
    },
    annual: {
      USD: 'STRIPE_PRICE_ID_BASIC_ANNUAL_USD',
      CAD: 'STRIPE_PRICE_ID_BASIC_ANNUAL_CAD',
    },
  },
  pro: {
    monthly: {
      USD: 'STRIPE_PRICE_ID_PRO_MONTHLY_USD',
      CAD: 'STRIPE_PRICE_ID_PRO_MONTHLY_CAD',
    },
    annual: {
      USD: 'STRIPE_PRICE_ID_PRO_ANNUAL_USD',
      CAD: 'STRIPE_PRICE_ID_PRO_ANNUAL_CAD',
    },
  },
};

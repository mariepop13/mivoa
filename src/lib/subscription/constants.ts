import type { SubscriptionPlan, PlanLimits, BillingCycle, Currency } from './types';

export const UNLIMITED_ENTRIES = -1;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ['free', 'supporter', 'basic', 'pro'];

export const SUPPORTER_PLAN_LIMITS: PlanLimits = {
  entriesPerMonth: 10,
  modelsAccess: ['gpt-3.5-turbo', 'claude-3-haiku'],
  exportEnabled: false,
  exportResolution: 'standard',
  advancedAnalysis: false,
  customTemplates: false,
};

export const SUPPORTER_ACCENT_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
];

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    entriesPerMonth: 10,
    modelsAccess: ['gpt-3.5-turbo', 'claude-3-haiku'],
    exportEnabled: false,
    exportResolution: 'standard',
    advancedAnalysis: false,
    customTemplates: false,
  },
  supporter: SUPPORTER_PLAN_LIMITS,
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

let cachedPlanLimits: Record<SubscriptionPlan, PlanLimits> | null = null;

export function getPlanLimitsWithCache(plan: SubscriptionPlan): PlanLimits {
  if (!cachedPlanLimits) {
    cachedPlanLimits = PLAN_LIMITS;
  }
  return cachedPlanLimits[plan];
}

export const PLAN_PRICING: Record<
  SubscriptionPlan,
  Record<BillingCycle, Record<Currency, number>>
> = {
  free: {
    monthly: { USD: 0, CAD: 0 },
    annual: { USD: 0, CAD: 0 },
  },
  supporter: {
    monthly: { USD: 299, CAD: 399 },
    annual: { USD: 2999, CAD: 3999 },
  },
  basic: {
    monthly: { USD: 699, CAD: 999 },
    annual: { USD: 6999, CAD: 9999 },
  },
  pro: {
    monthly: { USD: 1499, CAD: 1999 },
    annual: { USD: 14999, CAD: 19999 },
  },
};

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  free: [
    '10 entries per month',
    'Basic AI models',
    'Basic mood/themes detection',
    'Standard journal features',
  ],
  supporter: [
    'Support the project',
    'Supporter badge',
    'Exclusive accent colors',
    '10 entries per month',
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
  supporter: {
    monthly: {
      USD: 'STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD',
      CAD: 'STRIPE_PRICE_ID_SUPPORTER_MONTHLY_CAD',
    },
    annual: {
      USD: 'STRIPE_PRICE_ID_SUPPORTER_ANNUAL_USD',
      CAD: 'STRIPE_PRICE_ID_SUPPORTER_ANNUAL_CAD',
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

function isBuildTime(): boolean {
  return typeof window === 'undefined' && (
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-development-build' ||
    process.env.CI === 'true'
  );
}

function getPriceIdEnvKey(plan: 'supporter' | 'basic' | 'pro', cycle: 'monthly' | 'annual', currency: 'USD' | 'CAD'): string {
  return `STRIPE_PRICE_ID_${plan.toUpperCase()}_${cycle.toUpperCase()}_${currency}`;
}

function validateAllPriceIdEnvVars(): void {
  const missing: string[] = [];
  const plans: ('supporter' | 'basic' | 'pro')[] = ['supporter', 'basic', 'pro'];
  const cycles: ('monthly' | 'annual')[] = ['monthly', 'annual'];
  const currencies: ('USD' | 'CAD')[] = ['USD', 'CAD'];

  for (const plan of plans) {
    for (const cycle of cycles) {
      for (const currency of currencies) {
        const envKey = getPriceIdEnvKey(plan, cycle, currency);
        if (!process.env[envKey]) {
          missing.push(envKey);
        }
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe price ID environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}`
    );
  }
}

export function getPriceId(plan: 'supporter' | 'basic' | 'pro', cycle: 'monthly' | 'annual', currency: 'USD' | 'CAD' = 'USD'): string {
  if (isBuildTime()) {
    return '';
  }

  const envKey = getPriceIdEnvKey(plan, cycle, currency);
  const priceId = process.env[envKey];
  
  if (!priceId) {
    validateAllPriceIdEnvVars();
    throw new Error(`Missing environment variable: ${envKey}`);
  }
  
  return priceId;
}

import type { SubscriptionPlan, PlanLimits, BillingCycle, Currency } from './types';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ['free', 'supporter', 'pro'];

export const SUPPORTER_PLAN_LIMITS: PlanLimits = {
  advancedAnalysis: false,
  multiEntryAnalysis: false,
  periodSummary: false,
  exportPDF: false,
  exportBackup: false,
  customTemplates: false,
  semanticSearch: false,
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
    advancedAnalysis: false,
    multiEntryAnalysis: false,
    periodSummary: false,
    exportPDF: false,
    exportBackup: false,
    customTemplates: false,
    semanticSearch: false,
  },
  supporter: SUPPORTER_PLAN_LIMITS,
  pro: {
    advancedAnalysis: true,
    multiEntryAnalysis: true,
    periodSummary: true,
    exportPDF: true,
    exportBackup: true,
    customTemplates: true,
    semanticSearch: true,
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
  pro: {
    monthly: { USD: 699, CAD: 999 },
    annual: { USD: 6999, CAD: 9999 },
  },
};

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  free: [
    'UnlimitedEntries',
    'AllAIModels',
    'BasicAnalysis',
    'DefaultTemplates',
  ],
  supporter: [
    'UnlimitedEntries',
    'AllAIModels',
    'BasicAnalysis',
    'DefaultTemplates',
    'SupporterBadge',
    'ExclusiveAccentColors',
  ],
  pro: [
    'UnlimitedEntries',
    'AllAIModels',
    'AdvancedAnalysis',
    'MultiEntryAnalysis',
    'PeriodSummary',
    'ExportPDF',
    'ExportBackup',
    'CustomTemplates',
    'SemanticSearch',
    'PrioritySupport',
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

function getPriceIdEnvKey(plan: 'supporter' | 'pro', cycle: 'monthly' | 'annual', currency: 'USD' | 'CAD'): string {
  return `STRIPE_PRICE_ID_${plan.toUpperCase()}_${cycle.toUpperCase()}_${currency}`;
}

function validateAllPriceIdEnvVars(): void {
  const missing: string[] = [];
  const plans: ('supporter' | 'pro')[] = ['supporter', 'pro'];
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

export function getPriceId(plan: 'supporter' | 'pro', cycle: 'monthly' | 'annual', currency: 'USD' | 'CAD' = 'USD'): string {
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

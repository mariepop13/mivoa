import { NextRequest, NextResponse } from 'next/server';
import { PLAN_LIMITS, PLAN_PRICING } from '@/lib/subscription/constants';
import type { SubscriptionPlan, Currency } from '@/lib/subscription/types';

export const dynamic = 'force-dynamic';

const PLAN_NAMES: Record<SubscriptionPlan, { en: string; fr: string }> = {
  free: { en: 'Free', fr: 'Gratuit' },
  basic: { en: 'Basic', fr: 'Basique' },
  pro: { en: 'Pro', fr: 'Pro' },
};

const PLAN_FEATURES: Record<SubscriptionPlan, { en: string[]; fr: string[] }> = {
  free: {
    en: ['10 entries per month', 'Basic AI models', 'Standard resolution'],
    fr: ['10 entrées par mois', 'Modèles IA de base', 'Résolution standard'],
  },
  basic: {
    en: [
      '100 entries per month',
      'Advanced AI models',
      'High resolution',
      'Export enabled',
      'AI analysis',
      'Conversation mode',
      'Summary generation',
    ],
    fr: [
      '100 entrées par mois',
      'Modèles IA avancés',
      'Haute résolution',
      'Export activé',
      'Analyse IA',
      'Mode conversation',
      'Génération de résumé',
    ],
  },
  pro: {
    en: [
      'Unlimited entries',
      'All AI models',
      'Unlimited resolution',
      'Export enabled',
      'AI analysis',
      'Conversation mode',
      'Summary generation',
      'Priority support',
    ],
    fr: [
      'Entrées illimitées',
      'Tous les modèles IA',
      'Résolution illimitée',
      'Export activé',
      'Analyse IA',
      'Mode conversation',
      'Génération de résumé',
      'Support prioritaire',
    ],
  },
};

function getLocale(request: NextRequest): 'en' | 'fr' {
  const acceptLanguage = request.headers.get('accept-language');
  const localeParam = request.nextUrl.searchParams.get('locale');

  if (localeParam === 'fr' || localeParam === 'en') {
    return localeParam;
  }

  if (acceptLanguage?.includes('fr')) {
    return 'fr';
  }

  return 'en';
}

function formatPrice(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    CAD: 'C$',
  };

  return `${symbols[currency]}${amount.toFixed(2)}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const currencyParam = request.nextUrl.searchParams.get('currency');
    const validCurrencies: Currency[] = ['USD', 'CAD'];
    const currency: Currency = currencyParam && validCurrencies.includes(currencyParam.toUpperCase() as Currency)
      ? (currencyParam.toUpperCase() as Currency)
      : 'USD';

    const locale = getLocale(request);

    const plans = (['free', 'basic', 'pro'] as SubscriptionPlan[]).map((planId) => {
      const limits = PLAN_LIMITS[planId];
      const pricing = PLAN_PRICING[planId as 'basic' | 'pro'] || { monthly: { USD: 0, CAD: 0 }, annual: { USD: 0, CAD: 0 } };

      const monthlyPrice = pricing.monthly[currency] / 100;
      const annualPrice = pricing.annual[currency] / 100;

      const annualSavings = monthlyPrice * 12 - annualPrice;
      const savingsPercent = monthlyPrice > 0 ? Math.round((annualSavings / (monthlyPrice * 12)) * 100) : 0;

      return {
        id: planId,
        name: PLAN_NAMES[planId][locale],
        price: {
          monthly: monthlyPrice,
          annual: annualPrice,
          monthlyFormatted: formatPrice(monthlyPrice, currency),
          annualFormatted: formatPrice(annualPrice, currency),
          annualSavings,
          annualSavingsFormatted: formatPrice(annualSavings, currency),
          savingsPercent,
        },
        currency,
        features: PLAN_FEATURES[planId][locale],
        limits,
      };
    });

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error('Failed to get plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

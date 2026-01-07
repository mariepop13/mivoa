import { NextRequest, NextResponse } from 'next/server';
import { PLAN_LIMITS, PLAN_PRICING, PLAN_FEATURES } from '@/lib/subscription/constants';
import type { SubscriptionPlan, Currency } from '@/lib/subscription/types';
import enTranslations from '@/locales/en.json';
import frTranslations from '@/locales/fr.json';

export const dynamic = 'force-dynamic';

const PLAN_NAMES: Record<SubscriptionPlan, { en: string; fr: string }> = {
  free: { en: 'Free', fr: 'Gratuit' },
  supporter: { en: 'Supporter', fr: 'Supporter' },
  basic: { en: 'Basic', fr: 'Basique' },
  pro: { en: 'Pro', fr: 'Pro' },
};

function getTranslatedFeatures(plan: SubscriptionPlan, locale: 'en' | 'fr'): string[] {
  const translations = locale === 'fr' ? frTranslations : enTranslations;
  const featureKeys = PLAN_FEATURES[plan];
  
  return featureKeys.map((key) => {
    const features = translations.subscription?.features as Record<string, string> | undefined;
    const translation = features?.[key];
    return typeof translation === 'string' ? translation : key;
  });
}

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

    const plans = (['free', 'supporter', 'basic', 'pro'] as SubscriptionPlan[]).map((planId) => {
      const limits = PLAN_LIMITS[planId];
      const pricing = PLAN_PRICING[planId] || { monthly: { USD: 0, CAD: 0 }, annual: { USD: 0, CAD: 0 } };

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
        features: getTranslatedFeatures(planId, locale),
        limits,
      };
    });

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error('Failed to get plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

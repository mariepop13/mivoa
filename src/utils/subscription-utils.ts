import type { Currency } from '@/lib/subscription/types';

export function formatPlanPrice(price: number, currency: Currency = 'USD'): string {
  const symbol = getCurrencySymbol(currency);
  const amount = (price / 100).toFixed(2);
  return `${symbol}${amount}`;
}

export function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case 'USD':
      return '$';
    case 'CAD':
      return 'CA$';
    default:
      return '$';
  }
}

export function calculateAnnualSavings(monthlyPrice: number): {
  amount: number;
  percentage: number;
} {
  const monthlyTotal = monthlyPrice * 12;
  const annualPrice = monthlyPrice * 10;
  const savings = monthlyTotal - annualPrice;
  const percentage = Math.round((savings / monthlyTotal) * 100);
  
  return {
    amount: savings,
    percentage,
  };
}


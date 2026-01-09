import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not defined in .env.local');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY.startsWith('sk_live_') && !STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  console.error('❌ STRIPE_SECRET_KEY must start with sk_live_ or sk_test_');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover' as any,
  typescript: true,
});

const isTestMode = STRIPE_SECRET_KEY.startsWith('sk_test_');

const PLAN_PRICING: Record<string, Record<string, Record<string, number>>> = {
  supporter: {
    monthly: { USD: 299, CAD: 399 },
    annual: { USD: 2999, CAD: 3999 },
  },
  pro: {
    monthly: { USD: 699, CAD: 999 },
    annual: { USD: 6999, CAD: 9999 },
  },
};

interface PriceValidationResult {
  envKey: string;
  priceId: string | undefined;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stripePrice?: Stripe.Price;
  expectedAmount?: number;
  actualAmount?: number;
}

function getPriceIdEnvKey(plan: 'supporter' | 'pro', cycle: 'monthly' | 'annual', currency: 'USD' | 'CAD'): string {
  return `STRIPE_PRICE_ID_${plan.toUpperCase()}_${cycle.toUpperCase()}_${currency}`;
}

function validatePriceIdFormat(priceId: string | undefined): boolean {
  if (!priceId) {
    return false;
  }
  return priceId.startsWith('price_');
}

async function validateStripePrices(): Promise<void> {
  console.log(`\n🔍 Validating Stripe Price IDs (mode: ${isTestMode ? 'TEST' : 'LIVE'})...\n`);

  const plans: Array<'supporter' | 'pro'> = ['supporter', 'pro'];
  const cycles: Array<'monthly' | 'annual'> = ['monthly', 'annual'];
  const cyclesToInterval: Record<string, 'month' | 'year'> = {
    monthly: 'month',
    annual: 'year',
  };
  const currencies: Array<'USD' | 'CAD'> = ['USD', 'CAD'];

  const results: PriceValidationResult[] = [];

  for (const plan of plans) {
    for (const cycle of cycles) {
      for (const currency of currencies) {
        const envKey = getPriceIdEnvKey(plan, cycle, currency);
        const priceId = process.env[envKey];
        const result: PriceValidationResult = {
          envKey,
          priceId,
          isValid: true,
          errors: [],
          warnings: [],
        };

        if (!priceId) {
          result.isValid = false;
          result.errors.push('Environment variable not defined');
          results.push(result);
          continue;
        }

        if (!validatePriceIdFormat(priceId)) {
          result.isValid = false;
          result.errors.push(`Invalid format: must start with "price_"`);
          results.push(result);
          continue;
        }

        try {
          const stripePrice = await stripe.prices.retrieve(priceId);
          result.stripePrice = stripePrice;

          if (!stripePrice.active) {
            result.isValid = false;
            result.errors.push('Price is not active in Stripe');
          }

          if (stripePrice.type !== 'recurring') {
            result.isValid = false;
            result.errors.push('Price is not of type "recurring"');
          } else if (stripePrice.recurring) {
            const expectedInterval = cyclesToInterval[cycle];
            if (stripePrice.recurring.interval !== expectedInterval) {
              result.isValid = false;
              result.errors.push(
                `Incorrect interval: expected "${expectedInterval}", found "${stripePrice.recurring.interval}"`
              );
            }
          }

          if (stripePrice.currency.toLowerCase() !== currency.toLowerCase()) {
            result.isValid = false;
            result.errors.push(
              `Incorrect currency: expected "${currency}", found "${stripePrice.currency.toUpperCase()}"`
            );
          }

          const expectedAmount = PLAN_PRICING[plan]?.[cycle]?.[currency];
          if (expectedAmount !== undefined) {
            result.expectedAmount = expectedAmount;
            const actualAmount = stripePrice.unit_amount || 0;
            result.actualAmount = actualAmount;

            if (actualAmount !== expectedAmount) {
              result.warnings.push(
                `Different amount: expected ${(expectedAmount / 100).toFixed(2)} ${currency}, found ${(actualAmount / 100).toFixed(2)} ${currency}`
              );
            }
          }
        } catch (error) {
          result.isValid = false;
          if (error instanceof Stripe.errors.StripeError) {
            if (error.code === 'resource_missing') {
              result.errors.push('Price ID not found in Stripe');
            } else {
              result.errors.push(`Stripe error: ${error.message} (code: ${error.code})`);
            }
          } else {
            result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        results.push(result);
      }
    }
  }

  console.log('📊 Validation results:\n');

  const validCount = results.filter(r => r.isValid && r.warnings.length === 0).length;
  const warningCount = results.filter(r => r.isValid && r.warnings.length > 0).length;
  const errorCount = results.filter(r => !r.isValid).length;

  for (const result of results) {
    const status = result.isValid && result.warnings.length === 0 ? '✅' : result.isValid ? '⚠️' : '❌';
    console.log(`${status} ${result.envKey}`);

    if (result.priceId) {
      console.log(`   Price ID: ${result.priceId}`);
    }

    if (result.stripePrice) {
      const amount = result.stripePrice.unit_amount || 0;
      const currency = result.stripePrice.currency.toUpperCase();
      const interval = result.stripePrice.recurring?.interval || 'unknown';
      console.log(`   Stripe: ${(amount / 100).toFixed(2)} ${currency} / ${interval}`);
    }

    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
    }

    console.log('');
  }

  console.log('📈 Summary:\n');
  console.log(`   ✅ Valid: ${validCount}/${results.length}`);
  console.log(`   ⚠️  With warnings: ${warningCount}/${results.length}`);
  console.log(`   ❌ Errors: ${errorCount}/${results.length}\n`);

  if (errorCount > 0) {
    console.log('❌ Errors detected. Please fix the environment variables.\n');
    process.exit(1);
  }

  if (warningCount > 0) {
    console.log('⚠️  Warnings detected. Please verify the amounts.\n');
  }

  if (validCount === results.length) {
    console.log('✅ All Price IDs are valid!\n');
  }
}

validateStripePrices().catch((error) => {
  console.error('❌ Error during validation:', error);
  process.exit(1);
});

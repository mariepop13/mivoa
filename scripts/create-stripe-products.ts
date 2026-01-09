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

interface PriceConfig {
  plan: 'supporter' | 'pro';
  cycle: 'monthly' | 'annual';
  currency: 'usd' | 'cad';
  amount: number;
  name: string;
  description: string;
}

const prices: PriceConfig[] = [
  {
    plan: 'supporter',
    cycle: 'monthly',
    currency: 'usd',
    amount: 299,
    name: 'Supporter - Monthly',
    description: 'Supporter monthly plan (USD)',
  },
  {
    plan: 'supporter',
    cycle: 'monthly',
    currency: 'cad',
    amount: 399,
    name: 'Supporter - Monthly',
    description: 'Supporter monthly plan (CAD)',
  },
  {
    plan: 'supporter',
    cycle: 'annual',
    currency: 'usd',
    amount: 2999,
    name: 'Supporter - Annual',
    description: 'Supporter annual plan (USD)',
  },
  {
    plan: 'supporter',
    cycle: 'annual',
    currency: 'cad',
    amount: 3999,
    name: 'Supporter - Annual',
    description: 'Supporter annual plan (CAD)',
  },
  {
    plan: 'pro',
    cycle: 'monthly',
    currency: 'usd',
    amount: 699,
    name: 'Pro - Monthly',
    description: 'Pro monthly plan (USD)',
  },
  {
    plan: 'pro',
    cycle: 'monthly',
    currency: 'cad',
    amount: 999,
    name: 'Pro - Monthly',
    description: 'Pro monthly plan (CAD)',
  },
  {
    plan: 'pro',
    cycle: 'annual',
    currency: 'usd',
    amount: 6999,
    name: 'Pro - Annual',
    description: 'Pro annual plan (USD)',
  },
  {
    plan: 'pro',
    cycle: 'annual',
    currency: 'cad',
    amount: 9999,
    name: 'Pro - Annual',
    description: 'Pro annual plan (CAD)',
  },
];

async function createStripeProducts(): Promise<void> {
  try {
    console.log(`\n🚀 Creating Stripe products (mode: ${isTestMode ? 'TEST' : 'LIVE'})...\n`);

    const productMap = new Map<string, Stripe.Product>();

    for (const priceConfig of prices) {
      const productKey = `${priceConfig.plan}-${priceConfig.cycle}`;

      if (!productMap.has(productKey)) {
        const productName = `${priceConfig.plan.charAt(0).toUpperCase() + priceConfig.plan.slice(1)} - ${priceConfig.cycle === 'monthly' ? 'Monthly' : 'Annual'}`;

        const product = await stripe.products.create({
          name: productName,
          description: `${priceConfig.plan} ${priceConfig.cycle === 'monthly' ? 'monthly' : 'annual'} plan`,
          metadata: {
            plan: priceConfig.plan,
            cycle: priceConfig.cycle,
          },
        });

        productMap.set(productKey, product);
        console.log(`✅ Product created: ${product.name} (${product.id})`);
      }
    }

    console.log('\n💰 Creating prices...\n');

    const priceResults: Array<{ envKey: string; priceId: string; amount: number; currency: string }> = [];

    for (const priceConfig of prices) {
      const productKey = `${priceConfig.plan}-${priceConfig.cycle}`;
      const product = productMap.get(productKey);

      if (!product) {
        console.error(`❌ Product not found for ${productKey}`);
        continue;
      }

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceConfig.amount,
        currency: priceConfig.currency,
        recurring: {
          interval: priceConfig.cycle === 'monthly' ? 'month' : 'year',
        },
        metadata: {
          plan: priceConfig.plan,
          cycle: priceConfig.cycle,
          currency: priceConfig.currency.toUpperCase(),
        },
      });

      const envKey = `STRIPE_PRICE_ID_${priceConfig.plan.toUpperCase()}_${priceConfig.cycle.toUpperCase()}_${priceConfig.currency.toUpperCase()}`;
      const formattedAmount = (priceConfig.amount / 100).toFixed(2);

      priceResults.push({
        envKey,
        priceId: price.id,
        amount: priceConfig.amount,
        currency: priceConfig.currency.toUpperCase(),
      });

      console.log(`✅ Price created: ${formattedAmount} ${priceConfig.currency.toUpperCase()} (${price.id})`);
    }

    console.log('\n📋 Environment variables to add to .env.local:\n');
    priceResults.forEach(({ envKey, priceId, amount, currency }) => {
      const formattedAmount = (amount / 100).toFixed(2);
      console.log(`${envKey}=${priceId}  # ${formattedAmount} ${currency}`);
    });

    console.log('\n✅ All products and prices have been created successfully!\n');

  } catch (error) {
    console.error('❌ Error creating products:', error);
    if (error instanceof Stripe.errors.StripeError) {
      console.error(`   Code: ${error.code}, Message: ${error.message}`);
    }
    process.exit(1);
  }
}

createStripeProducts();

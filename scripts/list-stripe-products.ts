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

interface PriceInfo {
  priceId: string;
  plan: string;
  cycle: string;
  currency: string;
  amount: number;
}

async function listStripeProducts(): Promise<void> {
  try {
    console.log(`\n🔍 Fetching Stripe products (mode: ${isTestMode ? 'TEST' : 'LIVE'})...\n`);

    const products = await stripe.products.list({ limit: 100, active: true });

    if (products.data.length === 0) {
      console.log('❌ No products found in Stripe');
      return;
    }

    const prices: PriceInfo[] = [];

    for (const product of products.data) {
      const productPrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100,
      });

      for (const price of productPrices.data) {
        if (price.type === 'recurring' && price.recurring) {
          const planName = product.name.toLowerCase();
          const cycle = price.recurring.interval === 'month' ? 'monthly' : 'annual';
          const currency = price.currency.toUpperCase();
          const amount = price.unit_amount || 0;

          let plan = 'unknown';
          if (planName.includes('supporter')) {
            plan = 'supporter';
          } else if (planName.includes('pro')) {
            plan = 'pro';
          }

          prices.push({
            priceId: price.id,
            plan,
            cycle,
            currency,
            amount,
          });
        }
      }
    }

    if (prices.length === 0) {
      console.log('❌ No recurring prices found');
      return;
    }

    console.log('✅ Products and prices found:\n');
    console.log('📋 Environment variables to add to .env.local:\n');

    const priceMap: Record<string, PriceInfo> = {};
    prices.forEach(p => {
      const key = `${p.plan}_${p.cycle}_${p.currency}`;
      priceMap[key] = p;
    });

    const plans: Array<'supporter' | 'pro'> = ['supporter', 'pro'];
    const cycles: Array<'monthly' | 'annual'> = ['monthly', 'annual'];
    const currencies: Array<'USD' | 'CAD'> = ['USD', 'CAD'];

    for (const plan of plans) {
      for (const cycle of cycles) {
        for (const currency of currencies) {
          const key = `${plan}_${cycle}_${currency}`;
          const price = priceMap[key];
          
          if (price) {
            const envKey = `STRIPE_PRICE_ID_${plan.toUpperCase()}_${cycle.toUpperCase()}_${currency}`;
            const formattedAmount = (price.amount / 100).toFixed(2);
            console.log(`${envKey}=${price.priceId}  # ${formattedAmount} ${currency}`);
          } else {
            const envKey = `STRIPE_PRICE_ID_${plan.toUpperCase()}_${cycle.toUpperCase()}_${currency}`;
            console.log(`# ${envKey}=  # ⚠️  Not found`);
          }
        }
      }
    }

    console.log('\n📊 Summary by product:\n');
    const groupedByProduct = prices.reduce((acc, p) => {
      const key = `${p.plan} - ${p.cycle}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {} as Record<string, PriceInfo[]>);

    for (const [productKey, productPrices] of Object.entries(groupedByProduct)) {
      console.log(`  ${productKey}:`);
      productPrices.forEach(p => {
        const formattedAmount = (p.amount / 100).toFixed(2);
        console.log(`    - ${p.currency}: ${formattedAmount} ${p.currency} (${p.priceId})`);
      });
    }

  } catch (error) {
    console.error('❌ Error fetching products:', error);
    if (error instanceof Stripe.errors.StripeError) {
      console.error(`   Code: ${error.code}, Message: ${error.message}`);
    }
    process.exit(1);
  }
}

listStripeProducts();

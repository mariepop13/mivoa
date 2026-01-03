import Stripe from 'stripe';

const STRIPE_API_VERSION = '2025-12-15.clover';

let stripeClient: Stripe | null = null;

function validateStripeEnv(): { secretKey: string } {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      'Missing required Stripe environment variable: STRIPE_SECRET_KEY\n\nPlease set this variable in your .env.local file.'
    );
  }

  if (!secretKey.startsWith('sk_live_') && !secretKey.startsWith('sk_test_')) {
    throw new Error(
      "Invalid STRIPE_SECRET_KEY format. Stripe secret keys must start with 'sk_live_' or 'sk_test_'."
    );
  }

  return { secretKey };
}

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  try {
    const { secretKey } = validateStripeEnv();

    stripeClient = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION as any,
      typescript: true,
    });

    return stripeClient;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to initialize Stripe client');
  }
}

export function resetStripeClient(): void {
  stripeClient = null;
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getAdminFirestore } from '@/firebase/admin';
import Stripe from 'stripe';

vi.mock('@/lib/subscription/stripe-client');
vi.mock('@/firebase/admin');

describe('webhook route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  const createSubscriptionEvent = (type: string, subscription: Partial<Stripe.Subscription>): Stripe.Event => {
    return {
      id: 'evt_test',
      object: 'event',
      type: type as Stripe.Event.Type,
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 0,
      request: null,
      api_version: '2024-12-18.acacia',
      data: {
        object: subscription as Stripe.Subscription,
      },
    } as Stripe.Event;
  };

  const createRequest = (event: Stripe.Event, signature: string) => {
    const body = JSON.stringify(event);
    return new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body,
      headers: {
        'stripe-signature': signature,
        'Content-Type': 'application/json',
      },
    });
  };

  it('should return 401 when signature is missing', async () => {
    const event = createSubscriptionEvent('customer.subscription.created', { id: 'sub_test' });
    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Missing signature');
  });

  it('should return 401 when signature is invalid', async () => {
    const event = createSubscriptionEvent('customer.subscription.created', { id: 'sub_test' });
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockImplementation(() => {
          throw new Error('Invalid signature');
        }),
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const request = createRequest(event, 'invalid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid signature');
  });

  it('should handle subscription.created event', async () => {
    const subscription: Partial<Stripe.Subscription> = {
      id: 'sub_test',
      customer: 'cus_test',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
      cancel_at_period_end: false,
      metadata: { userId: 'user-id', planId: 'supporter' },
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            price: {
              id: 'price_test',
              recurring: { interval: 'month' },
            },
          } as any,
        ],
        has_more: false,
        url: '',
      } as Stripe.ApiList<Stripe.SubscriptionItem>,
    };

    const event = createSubscriptionEvent('customer.subscription.created', subscription);
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const mockDoc = {
      set: vi.fn().mockResolvedValue(undefined),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue(mockDoc),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest(event, 'valid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockDoc.set).toHaveBeenCalled();
  });

  it('should handle subscription.updated event', async () => {
    const subscription: Partial<Stripe.Subscription> = {
      id: 'sub_test',
      customer: 'cus_test',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
      cancel_at_period_end: false,
      metadata: { userId: 'user-id', planId: 'pro' },
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            price: {
              id: 'price_test',
              recurring: { interval: 'year' },
            },
          } as any,
        ],
        has_more: false,
        url: '',
      } as Stripe.ApiList<Stripe.SubscriptionItem>,
    };

    const event = createSubscriptionEvent('customer.subscription.updated', subscription);
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const mockDoc = {
      set: vi.fn().mockResolvedValue(undefined),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue(mockDoc),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest(event, 'valid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockDoc.set).toHaveBeenCalledWith(expect.any(Object), { merge: true });
  });

  it('should handle subscription.deleted event', async () => {
    const subscription: Partial<Stripe.Subscription> = {
      id: 'sub_test',
      customer: 'cus_test',
      status: 'canceled',
      metadata: { userId: 'user-id' },
      items: {
        object: 'list',
        data: [],
        has_more: false,
        url: '',
      } as Stripe.ApiList<Stripe.SubscriptionItem>,
    };

    const event = createSubscriptionEvent('customer.subscription.deleted', subscription);
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const mockDoc = {
      set: vi.fn().mockResolvedValue(undefined),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue(mockDoc),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest(event, 'valid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockDoc.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'canceled',
        cancelAtPeriodEnd: false,
      }),
      { merge: true }
    );
  });

  it('should handle unknown event types', async () => {
    const event = createSubscriptionEvent('customer.created', { id: 'cus_test' } as any);
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const request = createRequest(event, 'valid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });


  it('should handle unknown subscription status and default to free', async () => {
    const subscription: Partial<Stripe.Subscription> = {
      id: 'sub_test',
      customer: 'cus_test',
      status: 'unknown_status' as any,
      metadata: { userId: 'user-id', planId: 'supporter' },
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            price: {
              id: 'price_test',
              recurring: { interval: 'month' },
            },
          } as any,
        ],
        has_more: false,
        url: '',
      } as Stripe.ApiList<Stripe.SubscriptionItem>,
    };

    const event = createSubscriptionEvent('customer.subscription.created', subscription);
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const mockDoc = {
      set: vi.fn().mockResolvedValue(undefined),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue(mockDoc),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest(event, 'valid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockDoc.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'free',
      }),
      { merge: true }
    );
  });

  it('should handle subscription with invalid planId in metadata', async () => {
    const subscription: Partial<Stripe.Subscription> = {
      id: 'sub_test',
      customer: 'cus_test',
      status: 'active',
      metadata: { userId: 'user-id', planId: 'invalid-plan' },
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            price: {
              id: 'price_test',
              recurring: { interval: 'month' },
            },
          } as any,
        ],
        has_more: false,
        url: '',
      } as Stripe.ApiList<Stripe.SubscriptionItem>,
    };

    const event = createSubscriptionEvent('customer.subscription.created', subscription);
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const mockDoc = {
      set: vi.fn().mockResolvedValue(undefined),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue(mockDoc),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest(event, 'valid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockDoc.set).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'free',
      }),
      { merge: true }
    );
  });

  it('should return 500 when Firestore update fails', async () => {
    const subscription: Partial<Stripe.Subscription> = {
      id: 'sub_test',
      customer: 'cus_test',
      status: 'active',
      metadata: { userId: 'user-id', planId: 'supporter' },
      items: {
        object: 'list',
        data: [],
        has_more: false,
        url: '',
      } as Stripe.ApiList<Stripe.SubscriptionItem>,
    };

    const event = createSubscriptionEvent('customer.subscription.created', subscription);
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const mockDoc = {
      set: vi.fn().mockRejectedValue(new Error('Firestore error')),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue(mockDoc),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest(event, 'valid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Webhook processing failed');
  });

  it('should skip processing when userId is missing in subscription.created', async () => {
    const subscription: Partial<Stripe.Subscription> = {
      id: 'sub_test',
      customer: 'cus_test',
      status: 'active',
      metadata: {},
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            price: {
              id: 'price_test',
              recurring: { interval: 'month' },
            },
          } as any,
        ],
        has_more: false,
        url: '',
      } as Stripe.ApiList<Stripe.SubscriptionItem>,
    };

    const event = createSubscriptionEvent('customer.subscription.created', subscription);
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const mockDoc = {
      set: vi.fn().mockResolvedValue(undefined),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue(mockDoc),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest(event, 'valid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockDoc.set).not.toHaveBeenCalled();
  });

  it('should skip processing when userId is missing in subscription.updated', async () => {
    const subscription: Partial<Stripe.Subscription> = {
      id: 'sub_test',
      customer: 'cus_test',
      status: 'active',
      metadata: {},
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            price: {
              id: 'price_test',
              recurring: { interval: 'month' },
            },
          } as any,
        ],
        has_more: false,
        url: '',
      } as Stripe.ApiList<Stripe.SubscriptionItem>,
    };

    const event = createSubscriptionEvent('customer.subscription.updated', subscription);
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const mockDoc = {
      set: vi.fn().mockResolvedValue(undefined),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue(mockDoc),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest(event, 'valid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockDoc.set).not.toHaveBeenCalled();
  });

  it('should skip processing when userId is missing in subscription.deleted', async () => {
    const subscription: Partial<Stripe.Subscription> = {
      id: 'sub_test',
      customer: 'cus_test',
      status: 'canceled',
      metadata: {},
    };

    const event = createSubscriptionEvent('customer.subscription.deleted', subscription);
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const mockDoc = {
      set: vi.fn().mockResolvedValue(undefined),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue(mockDoc),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest(event, 'valid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockDoc.set).not.toHaveBeenCalled();
  });
});


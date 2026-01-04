import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { requireAuthenticatedUserId } from '@/lib/api-auth';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getOrCreateStripeCustomer, getStripePriceId } from '@/lib/stripe-helpers';
import { getAdminAuth } from '@/firebase/admin';

vi.mock('@/lib/api-auth');
vi.mock('@/lib/subscription/stripe-client');
vi.mock('@/lib/stripe-helpers');
vi.mock('@/firebase/admin');

describe('create-checkout route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  const createRequest = (body: unknown) =>
    new NextRequest('http://localhost:3000/api/stripe/create-checkout', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(requireAuthenticatedUserId).mockRejectedValue(new Error('Unauthorized'));

    const request = createRequest({ planId: 'basic', billingCycle: 'monthly' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 when planId is missing', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const request = createRequest({ billingCycle: 'monthly' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('planId is required');
  });

  it('should return 400 when billingCycle is missing', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const request = createRequest({ planId: 'basic' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('billingCycle is required');
  });

  it('should return 400 when planId is invalid', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const request = createRequest({ planId: 'invalid', billingCycle: 'monthly' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid planId');
  });

  it('should return 400 when billingCycle is invalid', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const request = createRequest({ planId: 'basic', billingCycle: 'invalid' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid billingCycle');
  });

  it('should return 400 when planId is free', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const request = createRequest({ planId: 'free', billingCycle: 'monthly' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Cannot create checkout for free plan');
  });

  it('should return 400 when currency is invalid', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const request = createRequest({ planId: 'basic', billingCycle: 'monthly', currency: 'EUR' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid currency');
  });

  it('should create checkout session successfully', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');
    vi.mocked(getAdminAuth).mockReturnValue({
      getUser: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
    } as any);

    const mockCustomer = { id: 'cus_test' };
    vi.mocked(getOrCreateStripeCustomer).mockResolvedValue(mockCustomer as any);
    vi.mocked(getStripePriceId).mockReturnValue('price_test');

    const mockSession = { url: 'https://checkout.stripe.com/test' };
    const mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue(mockSession),
        },
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const request = createRequest({ planId: 'basic', billingCycle: 'monthly', currency: 'USD' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://checkout.stripe.com/test');
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_test',
        mode: 'subscription',
        metadata: expect.objectContaining({
          userId: 'user-id',
          planId: 'basic',
          billingCycle: 'monthly',
        }),
      })
    );
  });

  it('should default to USD when currency not provided', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');
    vi.mocked(getAdminAuth).mockReturnValue({
      getUser: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
    } as any);

    const mockCustomer = { id: 'cus_test' };
    vi.mocked(getOrCreateStripeCustomer).mockResolvedValue(mockCustomer as any);
    vi.mocked(getStripePriceId).mockReturnValue('price_test');

    const mockSession = { url: 'https://checkout.stripe.com/test' };
    const mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue(mockSession),
        },
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const request = createRequest({ planId: 'pro', billingCycle: 'annual' });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(getStripePriceId).toHaveBeenCalledWith('pro', 'annual', 'USD');
  });

  it('should return 500 when session URL is missing', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');
    vi.mocked(getAdminAuth).mockReturnValue({
      getUser: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
    } as any);

    const mockCustomer = { id: 'cus_test' };
    vi.mocked(getOrCreateStripeCustomer).mockResolvedValue(mockCustomer as any);
    vi.mocked(getStripePriceId).mockReturnValue('price_test');

    const mockSession = { url: null };
    const mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue(mockSession),
        },
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const request = createRequest({ planId: 'basic', billingCycle: 'monthly' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create checkout session');
  });

  it('should return 500 when unexpected error occurs', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');
    vi.mocked(getAdminAuth).mockReturnValue({
      getUser: vi.fn().mockRejectedValue(new Error('Database error')),
    } as any);

    const request = createRequest({ planId: 'basic', billingCycle: 'monthly' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should use request origin when NEXT_PUBLIC_APP_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');
    vi.mocked(getAdminAuth).mockReturnValue({
      getUser: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
    } as any);

    const mockCustomer = { id: 'cus_test' };
    vi.mocked(getOrCreateStripeCustomer).mockResolvedValue(mockCustomer as any);
    vi.mocked(getStripePriceId).mockReturnValue('price_test');

    const mockSession = { url: 'https://checkout.stripe.com/test' };
    const mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue(mockSession),
        },
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const request = createRequest({ planId: 'basic', billingCycle: 'monthly' });
    await POST(request);

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: expect.stringContaining('http://localhost:3000'),
        cancel_url: expect.stringContaining('http://localhost:3000'),
      })
    );
  });

  it('should handle CAD currency', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');
    vi.mocked(getAdminAuth).mockReturnValue({
      getUser: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
    } as any);

    const mockCustomer = { id: 'cus_test' };
    vi.mocked(getOrCreateStripeCustomer).mockResolvedValue(mockCustomer as any);
    vi.mocked(getStripePriceId).mockReturnValue('price_test_cad');

    const mockSession = { url: 'https://checkout.stripe.com/test' };
    const mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue(mockSession),
        },
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const request = createRequest({ planId: 'pro', billingCycle: 'monthly', currency: 'CAD' });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(getStripePriceId).toHaveBeenCalledWith('pro', 'monthly', 'CAD');
  });

  it('should handle case-insensitive currency', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');
    vi.mocked(getAdminAuth).mockReturnValue({
      getUser: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
    } as any);

    const mockCustomer = { id: 'cus_test' };
    vi.mocked(getOrCreateStripeCustomer).mockResolvedValue(mockCustomer as any);
    vi.mocked(getStripePriceId).mockReturnValue('price_test');

    const mockSession = { url: 'https://checkout.stripe.com/test' };
    const mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue(mockSession),
        },
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const request = createRequest({ planId: 'basic', billingCycle: 'annual', currency: 'usd' });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(getStripePriceId).toHaveBeenCalledWith('basic', 'annual', 'USD');
  });
});



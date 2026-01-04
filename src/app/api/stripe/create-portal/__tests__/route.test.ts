import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { requireAuthenticatedUserId } from '@/lib/api-auth';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import { getAdminFirestore } from '@/firebase/admin';

vi.mock('@/lib/api-auth');
vi.mock('@/lib/subscription/stripe-client');
vi.mock('@/firebase/admin');

describe('create-portal route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  const createRequest = () =>
    new NextRequest('http://localhost:3000/api/stripe/create-portal', {
      method: 'POST',
    });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(requireAuthenticatedUserId).mockRejectedValue(new Error('Unauthorized'));

    const request = createRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 when subscription does not exist', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const mockDoc = {
      exists: false,
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(mockDoc),
      }),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No subscription found');
  });

  it('should return 404 when Stripe customer ID is missing', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const mockDoc = {
      exists: true,
      data: vi.fn().mockReturnValue({
        stripeCustomerId: null,
      }),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(mockDoc),
      }),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No Stripe customer ID found');
  });

  it('should create portal session successfully', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const mockDoc = {
      exists: true,
      data: vi.fn().mockReturnValue({
        stripeCustomerId: 'cus_test',
      }),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(mockDoc),
      }),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const mockSession = { url: 'https://billing.stripe.com/test' };
    const mockStripe = {
      billingPortal: {
        sessions: {
          create: vi.fn().mockResolvedValue(mockSession),
        },
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const request = createRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://billing.stripe.com/test');
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_test',
      return_url: 'http://localhost:3000/subscription',
    });
  });

  it('should return 500 when unexpected error occurs', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue(new Error('Database error')),
      }),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const request = createRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should use request origin when NEXT_PUBLIC_APP_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const mockDoc = {
      exists: true,
      data: vi.fn().mockReturnValue({
        stripeCustomerId: 'cus_test',
      }),
    };
    const mockCollection = {
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(mockDoc),
      }),
    };
    const mockFirestore = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollection),
        }),
      }),
    };
    vi.mocked(getAdminFirestore).mockReturnValue(mockFirestore as any);

    const mockSession = { url: 'https://billing.stripe.com/test' };
    const mockStripe = {
      billingPortal: {
        sessions: {
          create: vi.fn().mockResolvedValue(mockSession),
        },
      },
    };
    vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

    const request = createRequest();
    await POST(request);

    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_test',
      return_url: 'http://localhost:3000/subscription',
    });
  });
});



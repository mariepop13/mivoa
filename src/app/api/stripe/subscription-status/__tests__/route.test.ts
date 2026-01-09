import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { requireAuthenticatedUserId } from '@/lib/api-auth';
import { getAdminFirestore } from '@/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

vi.mock('@/lib/api-auth');
vi.mock('@/firebase/admin');

describe('subscription-status route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = () =>
    new NextRequest('http://localhost:3000/api/stripe/subscription-status', {
      method: 'GET',
    });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(requireAuthenticatedUserId).mockImplementation(async () => {
      throw new Error('Unauthorized');
    });

    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return free plan when subscription does not exist', async () => {
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
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plan).toBe('free');
    expect(data.status).toBe('free');
    expect(data.billingCycle).toBeNull();
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=60');
  });

  it('should return subscription data when exists', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const now = Timestamp.now();
    const subscriptionData = {
      userId: 'user-id',
      plan: 'supporter' as const,
      status: 'active' as const,
      billingCycle: 'monthly' as const,
      stripeCustomerId: 'cus_test',
      stripeSubscriptionId: 'sub_test',
      currentPeriodStart: now,
      currentPeriodEnd: now,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };

    const mockDoc = {
      exists: true,
      data: vi.fn().mockReturnValue(subscriptionData),
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
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plan).toBe('supporter');
    expect(data.status).toBe('active');
    expect(data.billingCycle).toBe('monthly');
    expect(data.currentPeriodStart).toBe(now.toDate().toISOString());
    expect(data.currentPeriodEnd).toBe(now.toDate().toISOString());
    expect(data.cancelAtPeriodEnd).toBe(false);
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=60');
  });

  it('should return free plan when subscription doc exists but data is null', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const mockDoc = {
      exists: true,
      data: vi.fn().mockReturnValue(null),
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
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plan).toBe('free');
    expect(data.status).toBe('free');
    expect(data.billingCycle).toBeNull();
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=60');
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
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle subscription with optional fields', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const now = Timestamp.now();
    const subscriptionData = {
      userId: 'user-id',
      plan: 'pro' as const,
      status: 'active' as const,
      billingCycle: 'annual' as const,
      stripeCustomerId: 'cus_test',
      stripeSubscriptionId: 'sub_test',
      currentPeriodStart: now,
      currentPeriodEnd: now,
      cancelAtPeriodEnd: true,
      canceledAt: now,
      trialEnd: now,
      createdAt: now,
      updatedAt: now,
    };

    const mockDoc = {
      exists: true,
      data: vi.fn().mockReturnValue(subscriptionData),
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
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plan).toBe('pro');
    expect(data.status).toBe('active');
    expect(data.billingCycle).toBe('annual');
    expect(data.cancelAtPeriodEnd).toBe(true);
  });

  it('should handle subscription with missing optional fields', async () => {
    vi.mocked(requireAuthenticatedUserId).mockResolvedValue('user-id');

    const now = Timestamp.now();
    const subscriptionData = {
      userId: 'user-id',
      plan: 'supporter' as const,
      status: 'active' as const,
      createdAt: now,
      updatedAt: now,
    };

    const mockDoc = {
      exists: true,
      data: vi.fn().mockReturnValue(subscriptionData),
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
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plan).toBe('supporter');
    expect(data.status).toBe('active');
    expect(data.billingCycle).toBeNull();
    expect(data.currentPeriodStart).toBeNull();
    expect(data.currentPeriodEnd).toBeNull();
    expect(data.cancelAtPeriodEnd).toBe(false);
  });
});



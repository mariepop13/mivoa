import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { UNLIMITED_ENTRIES } from '@/lib/subscription/constants';

describe('plans route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (searchParams?: Record<string, string>) => {
    const url = new URL('http://localhost:3000/api/stripe/plans');
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return new NextRequest(url.toString(), { method: 'GET' });
  };

  it('should return plans with default USD currency', async () => {
    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans).toHaveLength(3);
    expect(data.plans[0].id).toBe('free');
    expect(data.plans[1].id).toBe('basic');
    expect(data.plans[2].id).toBe('pro');
    expect(data.plans[1].currency).toBe('USD');
    expect(data.plans[1].price.monthly).toBe(9.99);
  });

  it('should return plans with CAD currency when specified', async () => {
    const request = createRequest({ currency: 'CAD' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[1].currency).toBe('CAD');
    expect(data.plans[1].price.monthly).toBe(13.99);
  });

  it('should default to USD for invalid currency', async () => {
    const request = createRequest({ currency: 'EUR' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[1].currency).toBe('USD');
  });

  it('should return English names by default', async () => {
    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[0].name).toBe('Free');
    expect(data.plans[1].name).toBe('Basic');
    expect(data.plans[2].name).toBe('Pro');
  });

  it('should return French names when locale is fr', async () => {
    const request = createRequest({ locale: 'fr' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[0].name).toBe('Gratuit');
    expect(data.plans[1].name).toBe('Basique');
    expect(data.plans[2].name).toBe('Pro');
  });

  it('should return French names when Accept-Language header includes fr', async () => {
    const request = new NextRequest('http://localhost:3000/api/stripe/plans', {
      method: 'GET',
      headers: { 'Accept-Language': 'fr-CA,fr;q=0.9' },
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[0].name).toBe('Gratuit');
  });

  it('should include formatted prices', async () => {
    const request = createRequest({ currency: 'USD' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[1].price.monthlyFormatted).toBe('$9.99');
    expect(data.plans[1].price.annualFormatted).toBe('$99.99');
  });

  it('should include CAD formatted prices', async () => {
    const request = createRequest({ currency: 'CAD' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[1].price.monthlyFormatted).toBe('C$13.99');
    expect(data.plans[1].price.annualFormatted).toBe('C$139.99');
  });

  it('should calculate annual savings', async () => {
    const request = createRequest({ currency: 'USD' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const basicPlan = data.plans[1];
    const monthlyTotal = basicPlan.price.monthly * 12;
    const expectedSavings = monthlyTotal - basicPlan.price.annual;
    expect(basicPlan.price.annualSavings).toBe(expectedSavings);
    expect(basicPlan.price.savingsPercent).toBeGreaterThan(0);
  });

  it('should include plan limits', async () => {
    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[0].limits.entriesPerMonth).toBe(10);
    expect(data.plans[1].limits.entriesPerMonth).toBe(100);
    expect(data.plans[2].limits.entriesPerMonth).toBe(UNLIMITED_ENTRIES);
  });

  it('should include plan features', async () => {
    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[1].features).toBeInstanceOf(Array);
    expect(data.plans[1].features.length).toBeGreaterThan(0);
  });
});



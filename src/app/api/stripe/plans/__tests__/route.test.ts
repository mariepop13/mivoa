import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

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
    expect(data.plans[1].id).toBe('supporter');
    expect(data.plans[2].id).toBe('pro');
    expect(data.plans[1].currency).toBe('USD');
    expect(data.plans[1].price.monthly).toBe(2.99);
  });

  it('should return plans with CAD currency when specified', async () => {
    const request = createRequest({ currency: 'CAD' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[1].currency).toBe('CAD');
    expect(data.plans[1].price.monthly).toBe(3.99);
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
    expect(data.plans[1].name).toBe('Supporter');
    expect(data.plans[2].name).toBe('Pro');
  });

  it('should return French names when locale is fr', async () => {
    const request = createRequest({ locale: 'fr' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[0].name).toBe('Gratuit');
    expect(data.plans[1].name).toBe('Supporter');
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
    expect(data.plans[1].price.monthlyFormatted).toBe('$2.99');
    expect(data.plans[1].price.annualFormatted).toBe('$29.99');
  });

  it('should include CAD formatted prices', async () => {
    const request = createRequest({ currency: 'CAD' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[1].price.monthlyFormatted).toBe('C$3.99');
    expect(data.plans[1].price.annualFormatted).toBe('C$39.99');
  });

  it('should calculate annual savings', async () => {
    const request = createRequest({ currency: 'USD' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const supporterPlan = data.plans[1];
    const monthlyTotal = supporterPlan.price.monthly * 12;
    const expectedSavings = monthlyTotal - supporterPlan.price.annual;
    expect(supporterPlan.price.annualSavings).toBe(expectedSavings);
    expect(supporterPlan.price.savingsPercent).toBeGreaterThan(0);
  });

  it('should include plan limits', async () => {
    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[0].limits.advancedAnalysis).toBe(false);
    expect(data.plans[1].limits.advancedAnalysis).toBe(false);
    expect(data.plans[2].limits.advancedAnalysis).toBe(true);
  });

  it('should include plan features', async () => {
    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[1].features).toBeInstanceOf(Array);
    expect(data.plans[1].features.length).toBeGreaterThan(0);
  });

  it('should handle locale parameter with en value', async () => {
    const request = createRequest({ locale: 'en' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[0].name).toBe('Free');
  });

  it('should handle case-insensitive currency parameter', async () => {
    const request = createRequest({ currency: 'cad' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plans[1].currency).toBe('CAD');
  });

  it('should handle errors and return 500 status', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mapSpy = vi.spyOn(Array.prototype, 'map').mockImplementation(() => {
      throw new Error('Test error');
    });

    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to get plans:', expect.any(Error));

    mapSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});



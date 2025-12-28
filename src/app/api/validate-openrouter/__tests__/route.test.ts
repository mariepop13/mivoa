import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

global.fetch = vi.fn();

describe('validate-openrouter route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: { apiKey?: string }) => new NextRequest('http://localhost:3000/api/validate-openrouter', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

  it('should return 400 when apiKey is missing', async () => {
    const request = createRequest({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('API key is required');
  });

  it('should return 400 when apiKey is not a string', async () => {
    const request = createRequest({ apiKey: 123 as any });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('API key is required');
  });

  it('should return 400 when apiKey is too short', async () => {
    const request = createRequest({ apiKey: 'short' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('Invalid API key format');
  });

  it('should return valid:false for unauthorized response (401)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/key',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer valid-api-key-1234567890',
        }),
      })
    );
  });

  it('should return valid:false for forbidden response (403)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
    } as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
  });

  it('should return valid:true for valid API key', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'key-id',
        data: { some: 'data' },
      }),
    } as unknown as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
  });

  it('should return valid:true when response has id field', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'key-id',
      }),
    } as unknown as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
  });

  it('should return valid:false when response has error field', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        error: 'Invalid key',
      }),
    } as unknown as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
  });

  it('should return valid:false when response data is invalid', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(null),
    } as unknown as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
  });

  it('should handle fetch errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
  });

  it('should handle non-ok responses', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
  });

  it('should trim API key before validation', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'key-id' }),
    } as unknown as Response);

    const request = createRequest({ apiKey: '  valid-api-key-1234567890  ' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer valid-api-key-1234567890',
        }),
      })
    );
  });

  it('should return 400 for invalid JSON in request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/validate-openrouter', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('Invalid request');
  });
});


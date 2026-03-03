import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

global.fetch = vi.fn();

const VALID_ID_TOKEN = 'valid-firebase-id-token';

describe('validate-openrouter route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-firebase-api-key';
  });

  const createRequest = (body: { apiKey?: string }, idToken?: string) => new NextRequest('http://localhost:3000/api/validate-openrouter', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
    },
  });

  const mockFirebaseTokenValid = () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
  };

  it('should return 401 when Authorization header is missing', async () => {
    const request = createRequest({ apiKey: 'valid-api-key-1234567890' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('Authentication required');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should return 401 when Firebase token is invalid', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' }, 'invalid-token');

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('Invalid or expired token');
  });

  it('should return 400 when apiKey is missing', async () => {
    mockFirebaseTokenValid();

    const request = createRequest({}, VALID_ID_TOKEN);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('API key is required');
  });

  it('should return 400 when apiKey is not a string', async () => {
    mockFirebaseTokenValid();

    const request = createRequest({ apiKey: 123 as unknown as string }, VALID_ID_TOKEN);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('API key is required');
  });

  it('should return 400 when apiKey is too short', async () => {
    mockFirebaseTokenValid();

    const request = createRequest({ apiKey: 'short' }, VALID_ID_TOKEN);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('Invalid API key format');
  });

  it('should return valid:false for unauthorized response (401)', async () => {
    mockFirebaseTokenValid();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' }, VALID_ID_TOKEN);

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
    mockFirebaseTokenValid();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
    } as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' }, VALID_ID_TOKEN);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
  });

  it('should return valid:true for valid API key', async () => {
    mockFirebaseTokenValid();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'key-id',
        data: { some: 'data' },
      }),
    } as unknown as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' }, VALID_ID_TOKEN);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
  });

  it('should return valid:true when response has id field', async () => {
    mockFirebaseTokenValid();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'key-id',
      }),
    } as unknown as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' }, VALID_ID_TOKEN);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
  });

  it('should return valid:false when response has error field', async () => {
    mockFirebaseTokenValid();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        error: 'Invalid key',
      }),
    } as unknown as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' }, VALID_ID_TOKEN);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
  });

  it('should return valid:false when response data is invalid', async () => {
    mockFirebaseTokenValid();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(null),
    } as unknown as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' }, VALID_ID_TOKEN);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
  });

  it('should handle fetch errors', async () => {
    mockFirebaseTokenValid();
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' }, VALID_ID_TOKEN);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
  });

  it('should handle non-ok responses', async () => {
    mockFirebaseTokenValid();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const request = createRequest({ apiKey: 'valid-api-key-1234567890' }, VALID_ID_TOKEN);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
  });

  it('should trim API key before validation', async () => {
    mockFirebaseTokenValid();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'key-id' }),
    } as unknown as Response);

    const request = createRequest({ apiKey: '  valid-api-key-1234567890  ' }, VALID_ID_TOKEN);

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
    mockFirebaseTokenValid();

    const request = new NextRequest('http://localhost:3000/api/validate-openrouter', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VALID_ID_TOKEN}`,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe('Invalid request');
  });
});

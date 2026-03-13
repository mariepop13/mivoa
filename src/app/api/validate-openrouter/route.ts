import { NextRequest, NextResponse } from 'next/server';

const VALIDATION_URL = 'https://openrouter.ai/api/v1/key';
const FIREBASE_LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';
const MIN_API_KEY_LENGTH = 10;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  return apiKey.trim().length >= MIN_API_KEY_LENGTH;
}

function isUnauthorizedResponse(status: number): boolean {
  return status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN;
}

function isValidResponseData(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const responseData = data as Record<string, unknown>;

  if (responseData.error) {
    return false;
  }

  if (responseData.data && typeof responseData.data === 'object') {
    return true;
  }

  if (responseData.id && typeof responseData.id === 'string') {
    return true;
  }

  return false;
}

function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json(
    { valid: false, error: message },
    { status }
  );
}

async function verifyFirebaseIdToken(idToken: string): Promise<boolean> {
  const firebaseApiKey = process.env.FIREBASE_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!firebaseApiKey) return false;

  try {
    const response = await fetch(`${FIREBASE_LOOKUP_URL}?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateApiKeyWithOpenRouter(apiKey: string): Promise<{ isValid: boolean }> {
  try {
    const response = await fetch(VALIDATION_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (isUnauthorizedResponse(response.status)) {
        return { isValid: false };
      }
      return { isValid: false };
    }

    const data = await response.json();
    const isValid = isValidResponseData(data);

    return { isValid };
  } catch (error) {
    console.error('OpenRouter API key validation failed:', error);
    return { isValid: false };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('Authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!idToken) {
    return createErrorResponse('Authentication required', 401);
  }

  const isAuthenticated = await verifyFirebaseIdToken(idToken);
  if (!isAuthenticated) {
    return createErrorResponse('Invalid or expired token', 401);
  }

  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return createErrorResponse('API key is required', 400);
    }

    if (!isValidApiKeyFormat(apiKey)) {
      return createErrorResponse('Invalid API key format', 400);
    }

    const validationResult = await validateApiKeyWithOpenRouter(apiKey.trim());
    return NextResponse.json({ valid: validationResult.isValid }, { status: 200 });
  } catch (error) {
    console.error('Failed to parse request:', error);
    return createErrorResponse('Invalid request', 400);
  }
}

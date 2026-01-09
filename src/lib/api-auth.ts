import { NextRequest } from 'next/server';
import { getAdminAuth } from '@/firebase/admin';

export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Failed to verify ID token:', error);
    return null;
  }
}

export async function requireAuthenticatedUserId(request: NextRequest): Promise<string> {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return userId;
}



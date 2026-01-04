import { cookies } from 'next/headers';
import { getAdminAuth } from '@/firebase/admin';

export async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie.value);
    return decodedToken.uid;
  } catch (error) {
    console.error('Failed to verify session cookie:', error);
    return null;
  }
}

export async function requireAuthenticatedUserId(): Promise<string> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return userId;
}



import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getAuthenticatedUserId, requireAuthenticatedUserId } from '../api-auth';
import { getAdminAuth } from '@/firebase/admin';

vi.mock('@/firebase/admin');

describe('api-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthenticatedUserId', () => {
    it('should return null when no Authorization header exists', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {},
      });

      const userId = await getAuthenticatedUserId(request);

      expect(userId).toBeNull();
    });

    it('should return null when Authorization header does not start with Bearer', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Invalid token',
        },
      });

      const userId = await getAuthenticatedUserId(request);

      expect(userId).toBeNull();
    });

    it('should return userId when Authorization header is valid', async () => {
      const mockDecodedToken = { uid: 'test-user-id' };
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      vi.mocked(getAdminAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue(mockDecodedToken),
      } as any);

      const userId = await getAuthenticatedUserId(request);

      expect(userId).toBe('test-user-id');
    });

    it('should return null when token verification fails', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      });

      vi.mocked(getAdminAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid token')),
      } as any);

      const userId = await getAuthenticatedUserId(request);

      expect(userId).toBeNull();
    });
  });

  describe('requireAuthenticatedUserId', () => {
    it('should return userId when authenticated', async () => {
      const mockDecodedToken = { uid: 'test-user-id' };
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      vi.mocked(getAdminAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue(mockDecodedToken),
      } as any);

      const userId = await requireAuthenticatedUserId(request);

      expect(userId).toBe('test-user-id');
    });

    it('should throw error when not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {},
      });

      await expect(requireAuthenticatedUserId(request)).rejects.toThrow('Unauthorized');
    });
  });
});



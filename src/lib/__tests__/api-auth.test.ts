import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cookies } from 'next/headers';
import { getAuthenticatedUserId, requireAuthenticatedUserId } from '../api-auth';
import { getAdminAuth } from '@/firebase/admin';

vi.mock('next/headers');
vi.mock('@/firebase/admin');

describe('api-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthenticatedUserId', () => {
    it('should return null when no session cookie exists', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      const userId = await getAuthenticatedUserId();

      expect(userId).toBeNull();
    });

    it('should return null when session cookie has no value', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: undefined }),
      } as any);

      const userId = await getAuthenticatedUserId();

      expect(userId).toBeNull();
    });

    it('should return userId when session cookie is valid', async () => {
      const mockDecodedToken = { uid: 'test-user-id' };
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'valid-session-cookie' }),
      } as any);

      vi.mocked(getAdminAuth).mockReturnValue({
        verifySessionCookie: vi.fn().mockResolvedValue(mockDecodedToken),
      } as any);

      const userId = await getAuthenticatedUserId();

      expect(userId).toBe('test-user-id');
    });

    it('should return null when session cookie verification fails', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'invalid-session-cookie' }),
      } as any);

      vi.mocked(getAdminAuth).mockReturnValue({
        verifySessionCookie: vi.fn().mockRejectedValue(new Error('Invalid token')),
      } as any);

      const userId = await getAuthenticatedUserId();

      expect(userId).toBeNull();
    });
  });

  describe('requireAuthenticatedUserId', () => {
    it('should return userId when authenticated', async () => {
      const mockDecodedToken = { uid: 'test-user-id' };
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'valid-session-cookie' }),
      } as any);

      vi.mocked(getAdminAuth).mockReturnValue({
        verifySessionCookie: vi.fn().mockResolvedValue(mockDecodedToken),
      } as any);

      const userId = await requireAuthenticatedUserId();

      expect(userId).toBe('test-user-id');
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      await expect(requireAuthenticatedUserId()).rejects.toThrow('Unauthorized');
    });
  });
});



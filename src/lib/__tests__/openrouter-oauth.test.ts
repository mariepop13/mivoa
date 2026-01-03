import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initiateOAuthFlow,
  exchangeAuthCodeForApiKey,
} from '../openrouter-oauth';
import { generatePKCEPair } from '../pkce';

vi.mock('../pkce');

type MockFetchResponse = {
  ok: boolean;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
  status?: number;
};

const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

const mockWindowLocation = {
  href: '',
  origin: 'https://example.com',
};

// eslint-disable-next-line max-lines-per-function
describe('openrouter-oauth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });
    Object.defineProperty(window, 'location', {
      value: mockWindowLocation,
      writable: true,
    });
    vi.mocked(generatePKCEPair).mockResolvedValue({
      codeVerifier: 'test-verifier',
      codeChallenge: 'test-challenge',
      codeChallengeMethod: 'S256',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initiateOAuthFlow', () => {
    it('should validate callbackUrl is a string', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(initiateOAuthFlow('' as any)).rejects.toThrow('non-empty string');
    });

    it('should validate callbackUrl is a valid URL', async () => {
      await expect(initiateOAuthFlow('not-a-url')).rejects.toThrow('Invalid callback URL');
    });

    it('should allow HTTPS URLs', async () => {
      await initiateOAuthFlow('https://example.com/callback');

      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      expect(mockWindowLocation.href).toContain('openrouter.ai/auth');
    });

    it('should allow HTTP localhost URLs', async () => {
      await initiateOAuthFlow('http://localhost:3000/callback');

      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      expect(mockWindowLocation.href).toContain('openrouter.ai/auth');
    });

    it('should allow HTTP 127.0.0.1 URLs', async () => {
      await initiateOAuthFlow('http://127.0.0.1:3000/callback');

      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });

    it('should reject non-HTTPS non-localhost URLs', async () => {
      await expect(initiateOAuthFlow('http://example.com/callback')).rejects.toThrow(
        'HTTPS URL'
      );
    });

    it('should store PKCE and state in sessionStorage', async () => {
      await initiateOAuthFlow('https://example.com/callback');

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'openrouter_oauth_pkce',
        expect.stringContaining('test-verifier')
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'openrouter_oauth_state',
        expect.any(String)
      );
    });

    it('should redirect to OpenRouter auth URL with correct parameters', async () => {
      await initiateOAuthFlow('https://example.com/callback');

      expect(mockWindowLocation.href).toContain('openrouter.ai/auth');
      expect(mockWindowLocation.href).toContain('callback_url=https%3A%2F%2Fexample.com%2Fcallback');
      expect(mockWindowLocation.href).toContain('code_challenge=test-challenge');
      expect(mockWindowLocation.href).toContain('code_challenge_method=S256');
      expect(mockWindowLocation.href).toContain('state=');
    });

    it('should handle sessionStorage errors', async () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(initiateOAuthFlow('https://example.com/callback')).rejects.toThrow();
    });
  });

  describe('exchangeAuthCodeForApiKey', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'openrouter_oauth_state') return 'stored-state';
        if (key === 'openrouter_oauth_pkce') {
          return JSON.stringify({
            codeVerifier: 'test-verifier',
            codeChallenge: 'test-challenge',
            codeChallengeMethod: 'S256',
          });
        }
        return null;
      });
    });

    it('should validate code is a non-empty string', async () => {
      await expect(exchangeAuthCodeForApiKey('')).rejects.toThrow('non-empty string');
    });

    it('should validate state parameter matches stored state', async () => {
      await expect(exchangeAuthCodeForApiKey('code', 'wrong-state')).rejects.toThrow(
        'Invalid state parameter'
      );
    });

    it('should accept matching state parameter', async () => {
      const mockResponse: MockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ key: 'api-key-123' }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await exchangeAuthCodeForApiKey('code', 'stored-state');

      expect(result).toBe('api-key-123');
    });

    it('should throw error when PKCE data is not found', async () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      await expect(exchangeAuthCodeForApiKey('code')).rejects.toThrow('PKCE data not found');
    });

    it('should throw error when PKCE data is invalid JSON', async () => {
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'openrouter_oauth_pkce') return 'invalid-json';
        return 'stored-state';
      });

      await expect(exchangeAuthCodeForApiKey('code')).rejects.toThrow('Failed to parse');
    });

    it('should call OpenRouter API with correct parameters', async () => {
      const mockResponse: MockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ key: 'api-key-123' }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      await exchangeAuthCodeForApiKey('auth-code');

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/auth/keys',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: 'auth-code',
            code_verifier: 'test-verifier',
            code_challenge_method: 'S256',
          }),
        })
      );
    });

    it('should return API key on successful exchange', async () => {
      const mockResponse: MockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ key: 'api-key-123' }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await exchangeAuthCodeForApiKey('code');

      expect(result).toBe('api-key-123');
    });

    it('should remove PKCE and state from sessionStorage after success', async () => {
      const mockResponse: MockFetchResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ key: 'api-key-123' }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      await exchangeAuthCodeForApiKey('code');

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('openrouter_oauth_pkce');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('openrouter_oauth_state');
    });

    it('should handle API errors', async () => {
      const mockResponse: MockFetchResponse = {
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Bad Request'),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      await expect(exchangeAuthCodeForApiKey('code')).rejects.toThrow('Failed to exchange');
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(exchangeAuthCodeForApiKey('code')).rejects.toThrow();
    });
  });
});


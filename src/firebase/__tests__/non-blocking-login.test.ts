import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initiateAnonymousSignIn,
  initiateEmailSignUp,
  initiateEmailSignIn,
  signInWithGoogle,
  logout,
} from '../non-blocking-login';
import {
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { isAppOfflineError } from '../utils';
import type { Auth, UserCredential } from 'firebase/auth';

vi.mock('firebase/auth');
vi.mock('../utils');

const mockAuth = {
  app: {} as any,
  name: 'mock-auth',
  config: {} as any,
} as unknown as Auth;
const mockUserCredential = {
  user: { uid: 'test-user-id' },
} as UserCredential;

describe('non-blocking-login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initiateAnonymousSignIn', () => {
    it('should successfully sign in anonymously', async () => {
      vi.mocked(signInAnonymously).mockResolvedValue(mockUserCredential);

      const result = await initiateAnonymousSignIn(mockAuth);

      expect(signInAnonymously).toHaveBeenCalledWith(mockAuth);
      expect(result).toBe(mockUserCredential);
    });

    it('should handle offline errors with custom message', async () => {
      const offlineError = new Error('Network error');
      vi.mocked(signInAnonymously).mockRejectedValue(offlineError);
      vi.mocked(isAppOfflineError).mockReturnValue(true);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(initiateAnonymousSignIn(mockAuth)).rejects.toThrow(
        'Application is offline. Please check your internet connection and try again.'
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Anonymous sign-in failed: Application is offline. Authentication will be retried when online.'
      );
      consoleWarnSpy.mockRestore();
    });

    it('should throw other errors', async () => {
      const error = new Error('Auth error');
      vi.mocked(signInAnonymously).mockRejectedValue(error);
      vi.mocked(isAppOfflineError).mockReturnValue(false);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(initiateAnonymousSignIn(mockAuth)).rejects.toThrow('Auth error');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initiate anonymous sign-in:', error);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('initiateEmailSignUp', () => {
    it('should successfully create user with email and password', async () => {
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(mockUserCredential);

      const result = await initiateEmailSignUp(mockAuth, 'test@example.com', 'password123');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
      expect(result).toBe(mockUserCredential);
    });

    it('should validate email is required', async () => {
      await expect(initiateEmailSignUp(mockAuth, '', 'password123')).rejects.toThrow('Email is required');
      expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      await expect(initiateEmailSignUp(mockAuth, 'invalid-email', 'password123')).rejects.toThrow('Invalid email format');
      expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should validate password is required', async () => {
      await expect(initiateEmailSignUp(mockAuth, 'test@example.com', '')).rejects.toThrow('Password is required');
      expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      await expect(initiateEmailSignUp(mockAuth, 'test@example.com', '12345')).rejects.toThrow(
        'Password must be at least 6 characters long'
      );
      expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should handle errors from Firebase', async () => {
      const error = new Error('Email already in use');
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(initiateEmailSignUp(mockAuth, 'test@example.com', 'password123')).rejects.toThrow('Email already in use');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initiate email sign-up:', error);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('initiateEmailSignIn', () => {
    it('should successfully sign in with email and password', async () => {
      vi.mocked(signInWithEmailAndPassword).mockResolvedValue(mockUserCredential);

      const result = await initiateEmailSignIn(mockAuth, 'test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
      expect(result).toBe(mockUserCredential);
    });

    it('should validate email is required', async () => {
      await expect(initiateEmailSignIn(mockAuth, '', 'password123')).rejects.toThrow('Email is required');
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      await expect(initiateEmailSignIn(mockAuth, 'invalid-email', 'password123')).rejects.toThrow('Invalid email format');
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should validate password is required', async () => {
      await expect(initiateEmailSignIn(mockAuth, 'test@example.com', '')).rejects.toThrow('Password is required');
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      await expect(initiateEmailSignIn(mockAuth, 'test@example.com', '12345')).rejects.toThrow(
        'Password must be at least 6 characters long'
      );
      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should handle errors from Firebase', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(initiateEmailSignIn(mockAuth, 'test@example.com', 'password123')).rejects.toThrow('Invalid credentials');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initiate sign-in attempt:', error);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('signInWithGoogle', () => {
    it('should successfully sign in with Google', async () => {
      vi.mocked(signInWithPopup).mockResolvedValue(mockUserCredential);

      const result = await signInWithGoogle(mockAuth);

      expect(signInWithPopup).toHaveBeenCalled();
      expect(result).toBe(mockUserCredential);
    });

    it('should handle errors from Firebase', async () => {
      const error = new Error('Popup closed');
      vi.mocked(signInWithPopup).mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(signInWithGoogle(mockAuth)).rejects.toThrow('Popup closed');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sign in with Google:', error);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should successfully sign out', async () => {
      vi.mocked(signOut).mockResolvedValue(undefined);

      await logout(mockAuth);

      expect(signOut).toHaveBeenCalledWith(mockAuth);
    });

    it('should handle errors from Firebase', async () => {
      const error = new Error('Sign out failed');
      vi.mocked(signOut).mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(logout(mockAuth)).rejects.toThrow('Sign out failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sign out:', error);
      consoleErrorSpy.mockRestore();
    });
  });
});


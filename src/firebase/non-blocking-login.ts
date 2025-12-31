import {
  type Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  UserCredential,
} from 'firebase/auth';
import { isAppOfflineError } from './utils';

export const googleProvider = new GoogleAuthProvider();

function validateEmail(email: string) {
  if (!email || email.trim() === '') {
    throw new Error('Email is required');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
}

function validatePassword(password: string) {
  if (!password || password.trim() === '') {
    throw new Error('Password is required');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
}

export async function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  try {
    return await signInAnonymously(authInstance);
  } catch (error) {
    if (isAppOfflineError(error)) {
      console.warn('Anonymous sign-in failed: Application is offline. Authentication will be retried when online.');
      throw new Error('Application is offline. Please check your internet connection and try again.');
    }
    
    console.error('Failed to initiate anonymous sign-in:', error);
    throw error;
  }
}

export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  validateEmail(email);
  validatePassword(password);
  
  try {
    return await createUserWithEmailAndPassword(authInstance, email, password);
  } catch (error) {
    console.error('Failed to initiate email sign-up:', error);
    throw error;
  }
}

export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  validateEmail(email);
  validatePassword(password);

  try {
    return await signInWithEmailAndPassword(authInstance, email, password);
  } catch (error) {
    console.error('Failed to initiate sign-in attempt:', error);
    throw error;
  }
}

export async function signInWithGoogle(authInstance: Auth): Promise<UserCredential> {
  try {
    return await signInWithPopup(authInstance, googleProvider);
  } catch (error) {
    console.error('Failed to sign in with Google:', error);
    throw error;
  }
}

export async function logout(authInstance: Auth): Promise<void> {
  try {
    await signOut(authInstance);
  } catch (error) {
    console.error('Failed to sign out:', error);
    throw error;
  }
}

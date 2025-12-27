'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { isAppOfflineError } from './utils';

export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  
  let analytics: Analytics | null = null;
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(firebaseApp);
    } catch (error) {
      if (isAppOfflineError(error)) {
        console.warn('Firebase Analytics initialization skipped: Application is offline. Analytics will be available when online.');
      } else {
        console.warn('Firebase Analytics initialization failed (this is expected in some environments):', error);
      }
    }
  }

  return {
    firebaseApp,
    auth,
    firestore,
    analytics,
  };
}

export * from './provider';
export { FirebaseContext } from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';


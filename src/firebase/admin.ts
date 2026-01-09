import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminFirestore: Firestore | null = null;

function initializeAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
    }
    return null as unknown as App;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn('Warning: FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Skipping Firebase Admin initialization during build.');
      return null as unknown as App;
    }
    throw error;
  }

  return adminApp;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    const app = initializeAdminApp();
    adminAuth = getAuth(app);
  }
  return adminAuth;
}

export function getAdminFirestore(): Firestore {
  if (!adminFirestore) {
    const app = initializeAdminApp();
    adminFirestore = getFirestore(app);
  }
  return adminFirestore;
}



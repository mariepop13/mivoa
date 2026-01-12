import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminFirestore: Firestore | null = null;

function validateServiceAccountCredentials(parsed: unknown): Record<string, unknown> {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must be a valid JSON object');
  }

  const obj = parsed as Record<string, unknown>;
  if (
    typeof obj.project_id !== 'string' ||
    typeof obj.private_key !== 'string' ||
    typeof obj.client_email !== 'string'
  ) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must contain project_id, private_key, and client_email');
  }
  return obj;
}

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
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
  }

  const serviceAccount = JSON.parse(serviceAccountKey);
  const validatedCredentials = validateServiceAccountCredentials(serviceAccount);
  adminApp = initializeApp({
    credential: cert(validatedCredentials as any),
  });

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



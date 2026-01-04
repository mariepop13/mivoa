import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminFirestore: Firestore | null = null;

function validateAdminEnv(): string {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      'Missing required Firebase Admin environment variable:\n  - FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID\n\nPlease set this variable in your .env.local file.'
    );
  }

  return projectId;
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

  const projectId = validateAdminEnv();

  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      }),
      projectId,
    });
  } else {
    adminApp = initializeApp({
      projectId,
    });
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



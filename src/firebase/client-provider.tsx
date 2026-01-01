'use client';

import { useMemo, type ReactNode } from 'react';
import { FirebaseProvider, initializeFirebase } from '@/firebase';

function reportProductionError(error: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    const errorMetadata = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      context: 'Firebase initialization',
    };

    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          firebase: errorMetadata,
        },
      });
    }
  } catch (reportingError) {
    console.error('Failed to report error to tracking service:', reportingError);
  }
}

function initializeFirebaseServices(): ReturnType<typeof initializeFirebase> | null {
  try {
    return initializeFirebase();
  } catch (error) {
    console.error(
      'Firebase initialization failed due to missing environment variables. ' +
      'Firebase features will not be available until environment variables are configured.',
      error
    );
    reportProductionError(error);
    return null;
  }
}

export function FirebaseClientProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const firebaseServices = useMemo<ReturnType<typeof initializeFirebase> | null>(
    () => initializeFirebaseServices(),
    []
  );

  if (!firebaseServices) {
    return (
      <FirebaseProvider
        areServicesAvailable={false}
        firebaseApp={null}
        firestore={null}
        auth={null}
      >
        {children}
      </FirebaseProvider>
    );
  }

  return (
    <FirebaseProvider
      areServicesAvailable={true}
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}


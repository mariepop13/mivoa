'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

export interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  areServicesAvailable?: boolean;
  firebaseApp?: FirebaseApp | null;
  firestore?: Firestore | null;
  auth?: Auth | null;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  areServicesAvailable,
  firebaseApp,
  firestore,
  auth,
}) => {
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = areServicesAvailable !== undefined 
      ? areServicesAvailable 
      : Boolean(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? (firebaseApp ?? null) : null,
      firestore: servicesAvailable ? (firestore ?? null) : null,
      auth: servicesAvailable ? (auth ?? null) : null,
    };
  }, [areServicesAvailable, firebaseApp, firestore, auth]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServices => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T extends object> = T & {__memo?: boolean};

export function applyMemoMarker<T extends object>(value: T): MemoFirebase<T> {
  if (typeof value === 'object' && value !== null) {
    (value as MemoFirebase<T>).__memo = true;
    return value as MemoFirebase<T>;
  }
  return value as MemoFirebase<T>;
}


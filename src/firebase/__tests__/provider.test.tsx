import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  FirebaseProvider,
  useFirebase,
  useAuth,
  useFirestore,
  useFirebaseApp,
  applyMemoMarker,
} from '../provider';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

const mockFirebaseApp = {} as FirebaseApp;
const mockFirestore = {} as Firestore;
const mockAuth = {} as Auth;

describe('FirebaseProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide services when all props are provided', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FirebaseProvider
        firebaseApp={mockFirebaseApp}
        firestore={mockFirestore}
        auth={mockAuth}
      >
        {children}
      </FirebaseProvider>
    );

    const { result } = renderHook(() => useFirebase(), { wrapper });

    expect(result.current.firebaseApp).toBe(mockFirebaseApp);
    expect(result.current.firestore).toBe(mockFirestore);
    expect(result.current.auth).toBe(mockAuth);
  });

  it('should determine services available from props when areServicesAvailable is not provided', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FirebaseProvider
        firebaseApp={mockFirebaseApp}
        firestore={mockFirestore}
        auth={mockAuth}
      >
        {children}
      </FirebaseProvider>
    );

    const { result } = renderHook(() => useFirebase(), { wrapper });

    expect(result.current.firebaseApp).toBe(mockFirebaseApp);
    expect(result.current.firestore).toBe(mockFirestore);
    expect(result.current.auth).toBe(mockAuth);
  });

  it('should use areServicesAvailable prop when provided', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FirebaseProvider
        areServicesAvailable={false}
        firebaseApp={mockFirebaseApp}
        firestore={mockFirestore}
        auth={mockAuth}
      >
        {children}
      </FirebaseProvider>
    );

    expect(() => {
      renderHook(() => useFirebase(), { wrapper });
    }).toThrow('Firebase core services not available');
  });

  it('should throw error when useFirebase is used outside provider', () => {
    expect(() => {
      renderHook(() => useFirebase());
    }).toThrow('useFirebase must be used within a FirebaseProvider');
  });

  it('should throw error when services are not available', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FirebaseProvider
        firebaseApp={null}
        firestore={null}
        auth={null}
      >
        {children}
      </FirebaseProvider>
    );

    expect(() => {
      renderHook(() => useFirebase(), { wrapper });
    }).toThrow('Firebase core services not available');
  });

  it('should return auth from useAuth', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FirebaseProvider
        firebaseApp={mockFirebaseApp}
        firestore={mockFirestore}
        auth={mockAuth}
      >
        {children}
      </FirebaseProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBe(mockAuth);
  });

  it('should return firestore from useFirestore', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FirebaseProvider
        firebaseApp={mockFirebaseApp}
        firestore={mockFirestore}
        auth={mockAuth}
      >
        {children}
      </FirebaseProvider>
    );

    const { result } = renderHook(() => useFirestore(), { wrapper });

    expect(result.current).toBe(mockFirestore);
  });

  it('should return firebaseApp from useFirebaseApp', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FirebaseProvider
        firebaseApp={mockFirebaseApp}
        firestore={mockFirestore}
        auth={mockAuth}
      >
        {children}
      </FirebaseProvider>
    );

    const { result } = renderHook(() => useFirebaseApp(), { wrapper });

    expect(result.current).toBe(mockFirebaseApp);
  });
});

describe('applyMemoMarker', () => {
  it('should add __memo marker to object', () => {
    const obj = { name: 'test', value: 123 };
    const result = applyMemoMarker(obj);

    expect(result).toEqual({ name: 'test', value: 123, __memo: true });
    expect(result).not.toBe(obj);
  });

  it('should return object with __memo when value is object', () => {
    const obj = { nested: { data: 'value' } };
    const result = applyMemoMarker(obj);

    expect(result.__memo).toBe(true);
    expect(result).not.toBe(obj);
  });

  it('should handle null values', () => {
    const result = applyMemoMarker(null as any);

    expect(result).toBe(null);
  });
});


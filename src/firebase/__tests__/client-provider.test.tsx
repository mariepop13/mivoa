import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { FirebaseClientProvider } from '../client-provider';
import * as firebaseModule from '../index';

vi.mock('../index', () => ({
  FirebaseProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="firebase-provider">{children}</div>,
  initializeFirebase: vi.fn(),
}));

vi.mock('@/repositories/firebase-storage-backend', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FirebaseStorageBackend: vi.fn(function (this: any) {
    this.subscribeToAuthState = vi.fn(() => () => {});
  }),
}));

vi.mock('@/repositories/local-storage-backend', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LocalStorageBackend: vi.fn(function (this: any) {
    this.subscribeToAuthState = vi.fn(() => () => {});
  }),
}));

describe('FirebaseClientProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_STORAGE_BACKEND = 'firebase';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_STORAGE_BACKEND;
  });

  it('should render children when Firebase initializes successfully', () => {
    const mockServices = {
      firebaseApp: {} as any,
      firestore: {} as any,
      auth: {} as any,
      analytics: null,
    };

    vi.mocked(firebaseModule.initializeFirebase).mockReturnValue(mockServices);

    const { getByTestId, getByText } = render(
      <FirebaseClientProvider>
        <div>Test Content</div>
      </FirebaseClientProvider>
    );

    expect(getByTestId('firebase-provider')).toBeInTheDocument();
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should render children with unavailable services when initialization fails', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Initialization failed');
    
    vi.mocked(firebaseModule.initializeFirebase).mockImplementation(() => {
      throw error;
    });

    const { getByTestId, getByText } = render(
      <FirebaseClientProvider>
        <div>Test Content</div>
      </FirebaseClientProvider>
    );

    expect(getByTestId('firebase-provider')).toBeInTheDocument();
    expect(getByText('Test Content')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle non-Error exceptions during initialization', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(firebaseModule.initializeFirebase).mockImplementation(() => {
      // eslint-disable-next-line no-throw-literal
      throw { message: 'String error' };
    });

    const { getByTestId } = render(
      <FirebaseClientProvider>
        <div>Test Content</div>
      </FirebaseClientProvider>
    );

    expect(getByTestId('firebase-provider')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});


interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  messagingSenderId: string;
  measurementId?: string;
  storageBucket?: string;
}

function validateFirebaseEnv(): FirebaseConfig {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  const missing: string[] = [];

  if (!apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');
  if (!authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!messagingSenderId) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');

  if (missing.length > 0) {
    const errorMessage = `Missing required Firebase environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nPlease set these variables in your .env.local file.`;
    throw new Error(errorMessage);
  }

  return {
    projectId: projectId!,
    appId: appId!,
    apiKey: apiKey!,
    authDomain: authDomain!,
    messagingSenderId: messagingSenderId!,
    ...(measurementId && { measurementId }),
    ...(storageBucket && { storageBucket }),
  };
}

export { validateFirebaseEnv };

function createFirebaseConfig() {
  return validateFirebaseEnv();
}

export { createFirebaseConfig };

function createLazyConfig() {
  let cachedConfig: ReturnType<typeof createFirebaseConfig> | null = null;
  
  function ensureInitialized() {
    if (!cachedConfig) {
      cachedConfig = createFirebaseConfig();
    }
    return cachedConfig;
  }
  
  return new Proxy({} as ReturnType<typeof createFirebaseConfig>, {
    get(_target, prop) {
      const config = ensureInitialized();
      return config[prop as keyof typeof config];
    },
    ownKeys(_target) {
      const config = ensureInitialized();
      return Reflect.ownKeys(config);
    },
    getOwnPropertyDescriptor(_target, prop) {
      const config = ensureInitialized();
      return Reflect.getOwnPropertyDescriptor(config, prop);
    },
    has(_target, prop) {
      const config = ensureInitialized();
      return Reflect.has(config, prop);
    },
    getPrototypeOf(_target) {
      const config = ensureInitialized();
      return Object.getPrototypeOf(config);
    },
    set(_target, prop, _value) {
      throw new Error(`Cannot modify Firebase config property '${String(prop)}': configuration is immutable after initialization.`);
    }
  });
}

export const firebaseConfig = createLazyConfig();


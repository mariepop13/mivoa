'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseContext, initiateAnonymousSignIn } from '@/firebase';

export default function TestAuthPage(): React.JSX.Element {
  const firebase = useContext(FirebaseContext);
  const router = useRouter();
  const didRun = useRef(false);
  const [setupError, setSetupError] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') {
      router.replace('/');
      return;
    }
    const auth = firebase?.auth;
    const firestore = firebase?.firestore;

    if (!auth || !firestore || didRun.current) return;
    didRun.current = true;

    async function setup(authService: Auth, firestoreService: Firestore): Promise<void> {
      const { user } = await initiateAnonymousSignIn(authService);
      const settingsRef = doc(firestoreService, `users/${user.uid}/settings/api`);
      await setDoc(settingsRef, { openRouterApiKey: 'test-openrouter-key' }, { merge: true });
      router.replace('/');
    }

    setup(auth, firestore).catch((error) => {
      console.error(error);
      setSetupError(true);
    });
  }, [firebase?.auth, firebase?.firestore, router]);

  if (setupError) {
    return <div data-testid="test-auth-setup-error">Test auth setup failed.</div>;
  }
  return <div data-testid="test-auth-setup">Setting up test session…</div>;
}

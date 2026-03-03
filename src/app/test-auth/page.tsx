'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore, initiateAnonymousSignIn } from '@/firebase';

export default function TestAuthPage(): React.JSX.Element {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const didRun = useRef(false);
  const [setupError, setSetupError] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') {
      router.replace('/');
      return;
    }
    if (!auth || !firestore || didRun.current) return;
    didRun.current = true;

    async function setup(): Promise<void> {
      const { user } = await initiateAnonymousSignIn(auth!);
      const settingsRef = doc(firestore!, `users/${user.uid}/settings/api`);
      await setDoc(settingsRef, { openRouterApiKey: 'test-openrouter-key' });
      router.replace('/');
    }

    setup().catch((error) => {
      console.error(error);
      setSetupError(true);
    });
  }, [auth, firestore, router]);

  if (setupError) {
    return <div data-testid="test-auth-setup-error">Test auth setup failed.</div>;
  }
  return <div data-testid="test-auth-setup">Setting up test session…</div>;
}

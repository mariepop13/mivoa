'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';

export default function TestAuthPage(): React.JSX.Element {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const didRun = useRef(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') {
      router.replace('/');
      return;
    }
    if (!auth || !firestore || didRun.current) return;
    didRun.current = true;

    async function setup(): Promise<void> {
      const { user } = await signInAnonymously(auth!);
      const settingsRef = doc(firestore!, `users/${user.uid}/settings/api`);
      await setDoc(settingsRef, { openRouterApiKey: 'test-openrouter-key' });
      router.replace('/');
    }

    setup().catch(console.error);
  }, [auth, firestore, router]);

  return <div data-testid="test-auth-setup">Setting up test session…</div>;
}

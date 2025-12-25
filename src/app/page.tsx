'use client';

import { useState, useMemo, useEffect, useRef, useContext } from 'react';
import { JournalEntry } from '@/components/journal-entry';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth, useFirestore, useDoc, FirebaseContext } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface JournalEntryData extends Record<string, unknown> {
  content: string;
  date: string;
  updatedAt: string | Timestamp;
}


function JournalApp() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isLoading: authLoading } = useUser();
  
  const [selectedDate] = useState(new Date());
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user && auth) {
      initiateAnonymousSignIn(auth).catch((error) => {
        console.error('Failed to sign in anonymously:', error);
        setAuthError('Authentication failed. Please check your Firebase configuration.');
      });
    }
  }, [auth, authLoading, user]);

  const entryDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return doc(firestore, `users/${user.uid}/entries/${dateKey}`);
  }, [firestore, user, selectedDate]);

  const { data: entryData, isLoading: entryLoading } = useDoc<JournalEntryData>(
    entryDocRef
  );
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    hasInitializedRef.current = false;
    setContent('');
    setLastSavedAt(null);
  }, [entryDocRef]);

  useEffect(() => {
    if (!hasInitializedRef.current && entryData !== undefined && !entryLoading) {
      if (entryData?.content !== undefined) {
        setContent(entryData.content || '');
        if (entryData.updatedAt) {
          let date: Date;
          if (entryData.updatedAt instanceof Timestamp) {
            date = entryData.updatedAt.toDate();
          } else if (typeof entryData.updatedAt === 'string') {
            date = new Date(entryData.updatedAt);
          } else {
            date = new Date();
          }
          setLastSavedAt(date);
        }
      } else {
        setContent('');
        setLastSavedAt(null);
      }
      hasInitializedRef.current = true;
    }
  }, [entryData, entryLoading]);

  const saveEntry = async (newContent: string) => {
    if (!entryDocRef || !user) {
      console.warn('Cannot save: missing entryDocRef or user', { 
        entryDocRef: Boolean(entryDocRef), 
        user: Boolean(user) 
      });
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    
    try {
      const data = {
        content: newContent,
        date: format(selectedDate, 'yyyy-MM-dd'),
        updatedAt: serverTimestamp(),
      };

      if (!entryData) {
        (data as Record<string, unknown>).createdAt = serverTimestamp();
      }

      await setDoc(entryDocRef, data, { merge: true });
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('setDoc error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error saving entry';
      setSaveError(errorMessage);
      setLastSavedAt(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setSaveError(null);
  };

  const handleSave = () => {
    saveEntry(content);
  };

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-headline font-bold mb-4 text-destructive">
            Authentication Error
          </h1>
          <p className="text-muted-foreground mb-4">{authError}</p>
        </div>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <JournalEntry
        date={selectedDate}
        content={content}
        onContentChange={handleContentChange}
        onSave={handleSave}
        isLoading={isSaving}
        isSaved={lastSavedAt !== null && !isSaving}
        error={saveError}
      />
    </main>
  );
}

export default function HomePage() {
  const firebaseContext = useContext(FirebaseContext);
  
  if (!firebaseContext?.areServicesAvailable) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-headline font-bold mb-4">
            Firebase Configuration Required
          </h1>
          <p className="text-muted-foreground mb-4">
            Please configure Firebase environment variables in your <code className="bg-muted px-2 py-1 rounded text-sm">.env.local</code> file
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Required variables:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
              <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
              <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
              <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
            </ul>
          </div>
        </div>
      </main>
    );
  }

  return <JournalApp />;
}


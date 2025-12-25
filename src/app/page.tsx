'use client';

import { useState, useMemo, useEffect, useRef, useContext } from 'react';
import { JournalEntry } from '@/components/journal-entry';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth, useFirestore, useCollection, useDoc, FirebaseContext, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { collection, doc, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface JournalEntryData extends Record<string, unknown> {
  content: string;
  date: string;
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
}


function JournalApp() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isLoading: authLoading } = useUser();
  
  const [selectedDate] = useState(new Date());
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    if (!authLoading && !user && auth) {
      initiateAnonymousSignIn(auth).catch((error) => {
        if (mounted) {
          console.error('Failed to sign in anonymously:', error);
          setAuthError('Authentication failed. Please check your Firebase configuration.');
        }
      });
    }
    
    return () => {
      mounted = false;
    };
  }, [auth, authLoading, user]);

  const entriesCollectionRef = useMemo(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/entries`);
  }, [firestore, user]);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const entriesQuery = useMemo(() => {
    if (!entriesCollectionRef) return null;
    const q = query(
      entriesCollectionRef,
      where('date', '==', dateKey)
    );
    return Object.assign(q, { __memo: true });
  }, [entriesCollectionRef, dateKey]);

  const { data: entriesRaw, isLoading: entriesLoading } = useCollection<JournalEntryData>(
    entriesQuery
  );

  const entries = useMemo(() => {
    if (!entriesRaw) return null;
    return [...entriesRaw].sort((a, b) => {
      const aTime = a.createdAt instanceof Timestamp 
        ? a.createdAt.toMillis() 
        : typeof a.createdAt === 'string' 
          ? new Date(a.createdAt).getTime() 
          : 0;
      const bTime = b.createdAt instanceof Timestamp 
        ? b.createdAt.toMillis() 
        : typeof b.createdAt === 'string' 
          ? new Date(b.createdAt).getTime() 
          : 0;
      return bTime - aTime;
    });
  }, [entriesRaw]);

  const selectedEntryDocRef = useMemo(() => {
    if (!firestore || !user || !selectedEntryId) return null;
    return doc(firestore, `users/${user.uid}/entries/${selectedEntryId}`);
  }, [firestore, user, selectedEntryId]);

  const { data: selectedEntryData, isLoading: selectedEntryLoading } = useDoc<JournalEntryData>(
    selectedEntryDocRef
  );

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    hasInitializedRef.current = false;
    setContent('');
    setLastSavedAt(null);
    setSelectedEntryId(null);
  }, [dateKey]);

  useEffect(() => {
    if (entries && entries.length > 0 && !selectedEntryId) {
      setSelectedEntryId(entries[0].id);
    }
  }, [entries, selectedEntryId]);

  useEffect(() => {
    if (!hasInitializedRef.current && selectedEntryData !== undefined && !selectedEntryLoading) {
      if (selectedEntryData?.content !== undefined) {
        setContent(selectedEntryData.content || '');
        if (selectedEntryData.updatedAt) {
          let date: Date;
          if (selectedEntryData.updatedAt instanceof Timestamp) {
            date = selectedEntryData.updatedAt.toDate();
          } else if (typeof selectedEntryData.updatedAt === 'string') {
            date = new Date(selectedEntryData.updatedAt);
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
  }, [selectedEntryData, selectedEntryLoading]);

  const createNewEntry = async (initialContent: string = '') => {
    if (!entriesCollectionRef || !user) {
      console.warn('Cannot create entry: missing collection ref or user');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const data = {
        content: initialContent,
        date: dateKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const newDocRef = await addDocumentNonBlocking(entriesCollectionRef, data);
      hasInitializedRef.current = false;
      setSelectedEntryId(newDocRef.id);
      setContent(initialContent);
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('addDoc error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error creating entry';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const saveEntry = async (newContent: string) => {
    if (!selectedEntryDocRef || !user) {
      console.warn('Cannot save: missing entryDocRef or user', { 
        entryDocRef: Boolean(selectedEntryDocRef), 
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
        updatedAt: serverTimestamp(),
      };

      await updateDocumentNonBlocking(selectedEntryDocRef, data);
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('updateDoc error:', error);
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
    if (selectedEntryId) {
      saveEntry(content);
    } else {
      createNewEntry(content);
    }
  };

  const handleEntrySelect = (entryId: string) => {
    setSelectedEntryId(entryId);
    hasInitializedRef.current = false;
  };

  const formatEntryTime = (entry: JournalEntryData & { id: string }) => {
    let date: Date;
    if (entry.createdAt instanceof Timestamp) {
      date = entry.createdAt.toDate();
    } else if (typeof entry.createdAt === 'string') {
      date = new Date(entry.createdAt);
    } else {
      return '';
    }
    return format(date, 'HH:mm');
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

  if (authLoading || entriesLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-headline font-semibold text-foreground">
            {format(selectedDate, "EEEE, MMMM d, yyyy", { locale: enUS })}
          </h1>
          <button
            onClick={() => createNewEntry('')}
            disabled={isSaving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            New Entry
          </button>
        </div>
        
        {entries && entries.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleEntrySelect(entry.id)}
                className={`px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                  selectedEntryId === entry.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {formatEntryTime(entry)}
              </button>
            ))}
          </div>
        )}

        <JournalEntry
          date={selectedDate}
          content={content}
          onContentChange={handleContentChange}
          onSave={handleSave}
          isLoading={isSaving}
          isSaved={lastSavedAt !== null && !isSaving}
          error={saveError}
          hideDate={true}
        />
      </div>
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


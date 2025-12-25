'use client';

import { useState, useMemo, useEffect, useRef, useContext } from 'react';
import { JournalEntry } from '@/components/journal-entry';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth, useFirestore, useCollection, useDoc, FirebaseContext, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { collection, doc, query, where, serverTimestamp, Timestamp, setDoc } from 'firebase/firestore';
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
    if (!entriesCollectionRef || !user || !firestore) {
      console.warn('Cannot create entry: missing collection ref, user, or firestore');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
      
      const entryId = `${dateKey}-${hours}${minutes}${seconds}${milliseconds}`;
      const newDocRef = doc(firestore, `users/${user.uid}/entries/${entryId}`);

      const data = {
        content: initialContent,
        date: dateKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDocumentNonBlocking(newDocRef, data, {});
      hasInitializedRef.current = false;
      setSelectedEntryId(entryId);
      setContent(initialContent);
      setLastSavedAt(now);
    } catch (error) {
      console.error('setDoc error:', error);
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

  const handleDelete = async () => {
    if (!selectedEntryDocRef || !selectedEntryId || !entries) {
      return;
    }

    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await deleteDocumentNonBlocking(selectedEntryDocRef);
      
      const currentIndex = entries.findIndex(e => e.id === selectedEntryId);
      const remainingEntries = entries.filter(e => e.id !== selectedEntryId);
      
      if (remainingEntries.length > 0) {
        const nextIndex = currentIndex < remainingEntries.length ? currentIndex : remainingEntries.length - 1;
        setSelectedEntryId(remainingEntries[nextIndex].id);
      } else {
        setSelectedEntryId(null);
        setContent('');
        setLastSavedAt(null);
      }
      
      hasInitializedRef.current = false;
    } catch (error) {
      console.error('deleteDoc error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error deleting entry';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
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
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">
              {format(selectedDate, "EEEE, MMMM d, yyyy", { locale: enUS })}
            </h1>
            {entries && entries.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'} today
              </p>
            )}
          </div>
          <button
            onClick={() => createNewEntry('')}
            disabled={isSaving}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              <span>+</span>
              <span>New Entry</span>
            </span>
          </button>
        </div>
        
        {entries && entries.length > 0 && (
          <div className="mb-6 flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleEntrySelect(entry.id)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  selectedEntryId === entry.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-card text-card-foreground border border-border hover:bg-accent hover:text-accent-foreground hover:border-primary/20 hover:shadow-sm'
                }`}
              >
                {formatEntryTime(entry)}
              </button>
            ))}
          </div>
        )}

        <div className="bg-card rounded-xl border border-border shadow-sm">
          <JournalEntry
            date={selectedDate}
            content={content}
            onContentChange={handleContentChange}
            onSave={handleSave}
            onDelete={handleDelete}
            isLoading={isSaving}
            isSaved={lastSavedAt !== null && !isSaving}
            error={saveError}
            hideDate={true}
            canDelete={!!selectedEntryId}
          />
        </div>
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


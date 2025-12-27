'use client';

import { useState, useMemo, useEffect, useRef, useContext } from 'react';
import { JournalEntry } from '@/components/journal-entry';
import { JournalChat } from '@/components/journal-chat';
import { SettingsMenu } from '@/components/settings-menu';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth, useFirestore, useCollection, useDoc, FirebaseContext, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { isAppOfflineError } from '@/firebase/utils';
import { collection, doc, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useTranslation } from '@/hooks/use-translation';
import { LanguageContext } from '@/context/LanguageContext';
import { useEntryAnalysis } from '@/hooks/use-entry-analysis';
import { generateConversationSummary } from '@/ai/services/conversation-summary-service';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import type { ChatMessage } from '@/ai/types/chat';

interface JournalEntryData extends Record<string, unknown> {
  content: string;
  title?: string;
  date: string;
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
  mood?: string;
  themes?: string[];
  keyTakeaways?: string[];
  aiProcessedAt?: Timestamp;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Timestamp | Date | string;
  }>;
  summaryGeneratedAt?: Timestamp;
  conversationMode?: boolean;
}


function JournalApp() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isLoading: authLoading } = useUser();
  const { language } = useContext(LanguageContext);
  const { t } = useTranslation();
  const { analyze } = useEntryAnalysis();
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  
  const dateLocale = language === 'fr' ? fr : enUS;
  
  const [selectedDate] = useState(new Date());
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    if (!authLoading && !user && auth) {
      initiateAnonymousSignIn(auth).catch((error) => {
        if (mounted) {
          if (isAppOfflineError(error)) {
            console.warn('Authentication failed: Application is offline. Please check your internet connection.');
            setAuthError('Application is offline. Please check your internet connection and try again.');
          } else {
            console.error('Failed to sign in anonymously:', error);
            setAuthError('Authentication failed. Please check your Firebase configuration.');
          }
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
    setTitle('');
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
        setTitle(selectedEntryData.title || '');
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
        setTitle('');
        setLastSavedAt(null);
      }
      hasInitializedRef.current = true;
    }
  }, [selectedEntryData, selectedEntryLoading]);

  const createNewEntry = async (initialContent: string = '', initialTitle: string = '') => {
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

      const data: Record<string, unknown> = {
        content: initialContent,
        date: dateKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (initialTitle) {
        data.title = initialTitle;
      }

      await setDocumentNonBlocking(newDocRef, data, {});
      hasInitializedRef.current = false;
      setSelectedEntryId(entryId);
      setContent(initialContent);
      setTitle(initialTitle);
      setLastSavedAt(now);

      if (initialContent.trim().length > 50) {
        analyze(initialContent).then((analysis) => {
          if (analysis) {
            const analysisData: Record<string, unknown> = {
              mood: analysis.mood,
              themes: analysis.themes,
              keyTakeaways: analysis.keyTakeaways,
              aiProcessedAt: serverTimestamp(),
            };
            const entryDocRef = doc(firestore, `users/${user.uid}/entries/${entryId}`);
            updateDocumentNonBlocking(entryDocRef, analysisData).catch((err) => {
              console.error('Failed to save entry analysis:', err);
            });
          }
        }).catch((err) => {
          console.error('Failed to analyze entry:', err);
        });
      }
    } catch (error) {
      console.error('setDoc error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error creating entry';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const saveEntry = async (newContent: string, newTitle: string) => {
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
      const data: Record<string, unknown> = {
        content: newContent,
        updatedAt: serverTimestamp(),
      };

      if (newTitle) {
        data.title = newTitle;
      }

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

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSaveError(null);
  };

  const handleSave = () => {
    if (selectedEntryId) {
      saveEntry(content, title);
    } else {
      createNewEntry(content, title);
    }
  };

  const handleSummarizeConversation = async (conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>) => {
    if (!apiKey || !user || !firestore) {
      setSaveError('API key not configured or services unavailable');
      return;
    }

    setIsGeneratingSummary(true);
    setSaveError(null);

    try {
      const lang = (language || 'en') as 'en' | 'fr';
      const chatMessages: ChatMessage[] = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      const summary = await generateConversationSummary(chatMessages, apiKey, lang);

      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
      
      const entryDateKey = format(selectedDate, 'yyyy-MM-dd');
      const entryId = `${entryDateKey}-${hours}${minutes}${seconds}${milliseconds}`;
      const newDocRef = doc(firestore, `users/${user.uid}/entries/${entryId}`);

      const conversationHistoryForStorage = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: Timestamp.fromDate(msg.timestamp),
      }));

      const data: Record<string, unknown> = {
        content: summary.content,
        title: summary.title,
        date: entryDateKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        conversationMode: true,
        conversationHistory: conversationHistoryForStorage,
        summaryGeneratedAt: serverTimestamp(),
        keyTakeaways: summary.insights,
      };

      await setDocumentNonBlocking(newDocRef, data, {});
      setSelectedEntryId(entryId);
      setContent(summary.content);
      setTitle(summary.title);
      setLastSavedAt(now);

      if (summary.content.trim().length > 50) {
        analyze(summary.content).then((analysis) => {
          if (analysis) {
            const analysisData: Record<string, unknown> = {
              mood: analysis.mood,
              themes: analysis.themes,
              aiProcessedAt: serverTimestamp(),
            };
            updateDocumentNonBlocking(newDocRef, analysisData).catch((err) => {
              console.error('Failed to save entry analysis:', err);
            });
          }
        }).catch((err) => {
          console.error('Failed to analyze entry:', err);
        });
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error generating summary';
      setSaveError(errorMessage);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntryDocRef || !selectedEntryId || !entries) {
      return;
    }

    if (!confirm(t('confirmDelete'))) {
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
        setTitle('');
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
    setIsSidebarOpen(false);
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
    return format(date, 'HH:mm:ss');
  };

  const recentEntries = useMemo(() => {
    if (!entries) return [];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoKey = format(sevenDaysAgo, 'yyyy-MM-dd');
    
    return entries
      .filter((entry) => {
        const entryDate = entry.date;
        return entryDate >= sevenDaysAgoKey && entry.id !== selectedEntryId;
      })
      .slice(0, 7)
      .map((entry) => ({
        content: entry.content,
        title: entry.title,
        date: entry.date,
      }));
  }, [entries, selectedEntryId]);

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-headline font-bold mb-4 text-destructive">
            {t('authenticationError')}
          </h1>
          <p className="text-muted-foreground mb-4">{authError}</p>
        </div>
      </main>
    );
  }

  if (authLoading || entriesLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">{t('loading')}</div>
      </main>
    );
  }

  const selectedEntry = entries?.find(e => e.id === selectedEntryId);

  return (
    <main className="min-h-screen bg-background">
      <div className="flex h-screen relative">
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-80 border-r border-border bg-card flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 sm:p-6 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl sm:text-2xl font-headline font-bold text-foreground">
                {format(selectedDate, "EEEE, MMMM d, yyyy", { locale: dateLocale })}
              </h1>
              <div className="flex items-center gap-2">
                <SettingsMenu />
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            {entries && entries.length > 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                {entries.length} {entries.length === 1 ? t('entry') : t('entries')} {t('today')}
              </p>
            )}
          </div>
          
          <div className="p-4 sm:p-6 border-b border-border">
            <button
              onClick={() => {
                createNewEntry('');
                setIsSidebarOpen(false);
              }}
              disabled={isSaving}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>+</span>
              <span>{t('newEntry')}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {entries && entries.length > 0 ? (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleEntrySelect(entry.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedEntryId === entry.id
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground border border-transparent'
                    }`}
                  >
                    <div className="font-medium">{entry.title || formatEntryTime(entry)}</div>
                    {entry.title && (
                      <div className="text-xs text-muted-foreground mt-1">{formatEntryTime(entry)}</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                {t('noEntriesYet')}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-background">
          <div className="lg:hidden p-4 border-b border-border bg-card flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <span className="text-xl">☰</span>
            </button>
            <h2 className="text-lg font-headline font-semibold text-foreground">
              {selectedEntry?.title || (selectedEntry ? formatEntryTime(selectedEntry) : entries?.[0] ? formatEntryTime(entries[0]) : '')}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
              <div className="bg-card rounded-xl border border-border shadow-sm h-full min-h-[600px] flex flex-col">
                {selectedEntryId ? (
                  <JournalEntry
                    date={selectedDate}
                    content={content}
                    title={title}
                    onContentChange={handleContentChange}
                    onTitleChange={handleTitleChange}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    isLoading={isSaving}
                    isSaved={lastSavedAt !== null && !isSaving}
                    error={saveError}
                    hideDate={true}
                    canDelete={!!selectedEntryId}
                    recentEntries={recentEntries}
                  />
                ) : (
                  <JournalChat
                    onSummarize={handleSummarizeConversation}
                    isLoadingSummary={isGeneratingSummary}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  const firebaseContext = useContext(FirebaseContext);
  const { t } = useTranslation();
  
  if (!firebaseContext?.areServicesAvailable) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-headline font-bold mb-4">
            {t('firebaseConfigurationRequired')}
          </h1>
          <p className="text-muted-foreground mb-4">
            {t('firebaseConfigurationDescription')} <code className="bg-muted px-2 py-1 rounded text-sm">{t('envFile')}</code> {t('file')}
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{t('requiredVariables')}</p>
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


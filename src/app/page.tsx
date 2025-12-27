'use client';

import { useState, useEffect, useContext } from 'react';
import { JournalEntry } from '@/components/journal-entry';
import { JournalChat } from '@/components/journal-chat';
import { SettingsMenu } from '@/components/settings-menu';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth, FirebaseContext } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { isAppOfflineError } from '@/firebase/utils';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useTranslation } from '@/hooks/use-translation';
import { LanguageContext } from '@/context/LanguageContext';
import { useJournalEntries, type JournalEntryData } from '@/hooks/use-journal-entries';

function JournalApp() {
  const auth = useAuth();
  const { user, isLoading: authLoading } = useUser();
  const { language } = useContext(LanguageContext);
  const { t } = useTranslation();
  
  const dateLocale = language === 'fr' ? fr : enUS;
  
  const [selectedDate] = useState(new Date());
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    entries,
    selectedEntry,
    selectedEntryData,
    entriesLoading,
    selectedEntryId,
    setSelectedEntryId,
    content,
    setContent,
    title,
    setTitle,
    isSaving,
    lastSavedAt,
    saveError,
    createNewEntry,
    saveEntry,
    handleDelete: handleDeleteFromHook,
    handleSummarizeConversation,
    isGeneratingSummary,
    recentEntries,
  } = useJournalEntries({ selectedDate });

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

  useEffect(() => {
    setContent('');
    setTitle('');
    setSelectedEntryId(null);
  }, [selectedDate, setContent, setTitle, setSelectedEntryId]);

  useEffect(() => {
    if (entries && entries.length > 0 && !selectedEntryId) {
      setSelectedEntryId(entries[0].id);
    }
  }, [entries, selectedEntryId]);

  useEffect(() => {
    if (selectedEntryData && selectedEntryData.content !== undefined) {
      setContent(selectedEntryData.content || '');
      setTitle(selectedEntryData.title || '');
    }
  }, [selectedEntryData]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const handleSave = () => {
    if (selectedEntryId) {
      saveEntry(content, title);
    } else {
      createNewEntry(content, title);
    }
  };

  const handleEntrySelect = (entryId: string) => {
    setSelectedEntryId(entryId);
    setIsSidebarOpen(false);
  };

  const formatEntryTime = (entry: JournalEntryData & { id: string }): string => {
    const createdAt = entry.createdAt;
    let date: Date;
    
    if (createdAt instanceof Date) {
      date = createdAt;
    } else if (typeof createdAt === 'string') {
      date = new Date(createdAt);
    } else {
      return '';
    }
    
    return format(date, 'HH:mm:ss');
  };

  const getEntryTitle = (
    entry: (JournalEntryData & { id: string }) | undefined,
    allEntries: (JournalEntryData & { id: string })[] | null
  ): string => {
    if (entry?.title) return entry.title;
    if (entry) return formatEntryTime(entry);
    if (allEntries?.[0]) return formatEntryTime(allEntries[0]);
    return '';
  };

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
              {getEntryTitle(selectedEntry, entries)}
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
                    onDelete={handleDeleteFromHook}
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

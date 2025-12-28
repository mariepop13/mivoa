'use client';

import { useState, useEffect, useContext } from 'react';
import { JournalSidebar } from '@/components/journal-sidebar';
import { JournalMainContent } from '@/components/journal-main-content';
import { JournalAuthError } from '@/components/journal-auth-error';
import { JournalLoadingState } from '@/components/journal-loading-state';
import { FirebaseContext } from '@/firebase';
import { useTranslation } from '@/hooks/use-translation';
import { useJournalEntries } from '@/hooks/use-journal-entries';
import { useJournalAuth } from '@/hooks/use-journal-auth';
import { useJournalHandlers } from '@/hooks/use-journal-handlers';
import { formatEntryTime, getEntryTitle } from '@/utils/journal-utils';

function JournalApp(): React.JSX.Element {
  const authState = useJournalAuth();
  const [selectedDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const journalEntries = useJournalEntries({ selectedDate });

  useEffect(() => {
    journalEntries.setContent('');
    journalEntries.setTitle('');
    journalEntries.setSelectedEntryId(null);
  }, [selectedDate]);

  useEffect(() => {
    if (journalEntries.selectedEntryData && journalEntries.selectedEntryData.content !== undefined) {
      journalEntries.setContent(journalEntries.selectedEntryData.content || '');
      journalEntries.setTitle(journalEntries.selectedEntryData.title || '');
    }
  }, [journalEntries.selectedEntryData, journalEntries.setContent, journalEntries.setTitle]);

  const handlers = useJournalHandlers({
    journalEntries,
    setIsSidebarOpen,
  });

  if (authState.authError) {
    return <JournalAuthError error={authState.authError} />;
  }

  if (authState.authLoading || journalEntries.entriesLoading) {
    return <JournalLoadingState />;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="flex h-screen relative">
        <JournalSidebar
          selectedDate={selectedDate}
          entries={journalEntries.entries}
          selectedEntryId={journalEntries.selectedEntryId}
          isSidebarOpen={isSidebarOpen}
          isSaving={journalEntries.isSaving}
          onClose={() => setIsSidebarOpen(false)}
          onNewEntry={handlers.handleNewEntry}
          onEntrySelect={handlers.handleEntrySelect}
          formatEntryTime={formatEntryTime}
        />
        <JournalMainContent
          selectedDate={selectedDate}
          selectedEntryId={journalEntries.selectedEntryId}
          selectedEntry={journalEntries.selectedEntry}
          entries={journalEntries.entries}
          content={journalEntries.content}
          title={journalEntries.title}
          isSaving={journalEntries.isSaving}
          lastSavedAt={journalEntries.lastSavedAt}
          saveError={journalEntries.saveError}
          isGeneratingSummary={journalEntries.isGeneratingSummary}
          recentEntries={journalEntries.recentEntries}
          onContentChange={handlers.handleContentChange}
          onSave={handlers.handleSave}
          onDelete={journalEntries.handleDelete}
          onSummarize={journalEntries.handleSummarizeConversation}
          getEntryTitle={getEntryTitle}
          onSidebarToggle={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
        />
      </div>
    </main>
  );
}

export default function HomePage(): React.JSX.Element {
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

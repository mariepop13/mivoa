'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import { format } from 'date-fns';
import { JournalSidebar } from '@/components/journal-sidebar';
import { JournalMainContent } from '@/components/journal-main-content';
import { JournalLoadingState } from '@/components/journal-loading-state';
import { TemplatePromptDialog } from '@/components/template-prompt-dialog';
import { FirebaseContext } from '@/firebase';
import { useTranslation } from '@/hooks/use-translation';
import { useJournalEntries } from '@/hooks/use-journal-entries';
import { useJournalAuth } from '@/hooks/use-journal-auth';
import { useJournalHandlers } from '@/hooks/use-journal-handlers';
import { useTemplateConversation } from '@/hooks/use-template-conversation';
import { formatEntryTime } from '@/utils/journal-utils';
import { parseEntryDate } from '@/utils/entry-linking-utils';
import type { EntryTemplate } from '@/hooks/use-entry-templates';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

const DATE_KEY_FORMAT = 'yyyy-MM-dd';

interface UseJournalEffectsParams {
  selectedDate: Date;
  setContent: (content: string) => void;
  setTitle: (title: string) => void;
  setSelectedEntryId: (id: string | null) => void;
  selectedEntryData: JournalEntryData | null;
}

function useJournalEffects({
  selectedDate,
  setContent,
  setTitle,
  setSelectedEntryId,
  selectedEntryData,
}: UseJournalEffectsParams): void {
  useEffect(() => {
    setContent('');
    setTitle('');
    setSelectedEntryId(null);
  }, [selectedDate, setContent, setTitle, setSelectedEntryId]);

  useEffect(() => {
    if (selectedEntryData && selectedEntryData.content !== undefined) {
      setContent(selectedEntryData.content || '');
      setTitle(selectedEntryData.title || '');
    }
  }, [selectedEntryData, setContent, setTitle]);
}

function buildSidebarProps({
  selectedDate,
  journalEntries,
  isSidebarOpen,
  setIsSidebarOpen,
  handlers,
  handleTemplateSelect,
  onDateChange,
}: {
  selectedDate: Date;
  journalEntries: ReturnType<typeof useJournalEntries>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  handlers: ReturnType<typeof useJournalHandlers>;
  handleTemplateSelect: (template: EntryTemplate) => void;
  onDateChange: (date: Date) => void;
}) {
  return {
    selectedDate,
    entries: journalEntries.entries,
    selectedEntryId: journalEntries.selectedEntryId,
    isSidebarOpen,
    isSaving: journalEntries.isSaving,
    onClose: () => setIsSidebarOpen(false),
    onNewEntry: handlers.handleNewEntry,
    onEntrySelect: handlers.handleEntrySelect,
    formatEntryTime,
    onTemplateSelect: handleTemplateSelect,
    onDateChange,
    handleDeleteDraft: journalEntries.handleDeleteDraft,
  };
}

function buildMainContentProps({
  selectedDate,
  journalEntries,
  setIsSidebarOpen,
  handlers,
  onDateChange: _onDateChange,
  handleNavigateToEntry,
  handleLinksUpdated,
  linksVersion,
}: {
  selectedDate: Date;
  journalEntries: ReturnType<typeof useJournalEntries>;
  setIsSidebarOpen: (open: boolean) => void;
  handlers: ReturnType<typeof useJournalHandlers>;
  onDateChange: (date: Date) => void;
  handleNavigateToEntry: (entry: JournalEntryData & { id: string }) => void;
  handleLinksUpdated: () => void;
  linksVersion: number;
}) {
  return {
    entry: {
      selectedDate,
      selectedEntryId: journalEntries.selectedEntryId,
      selectedEntry: journalEntries.selectedEntry,
      selectedEntryData: journalEntries.selectedEntryData,
      content: journalEntries.content,
      title: journalEntries.title,
      recentEntries: journalEntries.recentEntries,
      linksVersion,
    },
    actions: {
      onContentChange: handlers.handleContentChange,
      onSave: handlers.handleSave,
      onDelete: journalEntries.handleDelete,
      onChangeDate: journalEntries.changeEntryDate,
      onNavigateToEntry: handleNavigateToEntry,
      onLinksUpdated: handleLinksUpdated,
    },
    save: {
      isSaving: journalEntries.isSaving,
      lastSavedAt: journalEntries.lastSavedAt,
      saveError: journalEntries.saveError,
    },
    conversation: {
      isGeneratingSummary: journalEntries.isGeneratingSummary,
      onSummarize: journalEntries.handleSummarizeConversation,
      handleSaveDraft: journalEntries.handleSaveDraft,
      handleDeleteDraft: journalEntries.handleDeleteDraft,
      conversationEntryForDate: journalEntries.conversationEntryForDate,
    },
    dateKey: format(selectedDate, DATE_KEY_FORMAT),
    onSidebarToggle: () => setIsSidebarOpen(true),
  };
}

function JournalApp(): React.JSX.Element {
  const authState = useJournalAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EntryTemplate | null>(null);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);

  const journalEntries = useJournalEntries({ selectedDate, onDateChange: setSelectedDate });
  const {
    setContent,
    setTitle,
    setSelectedEntryId,
    selectedEntryData,
  } = journalEntries;

  const { createConversationFromPrompt } = useTemplateConversation({
    selectedDate,
    onSuccess: (draftId) => {
      setSelectedEntryId(draftId);
      setIsSidebarOpen(false);
    },
    onError: (error) => {
      console.error('Failed to create conversation:', error);
    },
  });

  useJournalEffects({
    selectedDate,
    setContent,
    setTitle,
    setSelectedEntryId,
    selectedEntryData,
  });

  const handlers = useJournalHandlers({
    journalEntries,
    setIsSidebarOpen,
  });

  const handleTemplateSelect = useCallback((template: EntryTemplate) => {
    setSelectedTemplate(template);
    setIsPromptDialogOpen(true);
    setIsSidebarOpen(false);
  }, []);

  const handleUsePrompt = useCallback(
    async (prompt: string) => {
      await createConversationFromPrompt(prompt);
    },
    [createConversationFromPrompt]
  );

  const handleNavigateToEntry = useCallback((entry: JournalEntryData & { id: string }) => {
    const entryDate = parseEntryDate(entry.date);
    setSelectedDate(entryDate);
    setSelectedEntryId(entry.id);
  }, [setSelectedEntryId]);

  const [linksVersion, setLinksVersion] = useState(0);

  const handleLinksUpdated = useCallback(() => {
    setLinksVersion((v) => v + 1);
  }, []);

  if (authState.authLoading || journalEntries.entriesLoading) {
    return <JournalLoadingState />;
  }

  const sidebarProps = buildSidebarProps({
    selectedDate,
    journalEntries,
    isSidebarOpen,
    setIsSidebarOpen,
    handlers,
    handleTemplateSelect,
    onDateChange: setSelectedDate,
  });

  const mainContentProps = buildMainContentProps({
    selectedDate,
    journalEntries,
    setIsSidebarOpen,
    handlers,
    onDateChange: setSelectedDate,
    handleNavigateToEntry,
    handleLinksUpdated,
    linksVersion,
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="flex h-screen relative">
        <JournalSidebar {...sidebarProps} />
        <JournalMainContent {...mainContentProps} />
      </div>
      <TemplatePromptDialog
        open={isPromptDialogOpen}
        onOpenChange={setIsPromptDialogOpen}
        template={selectedTemplate}
        onUsePrompt={handleUsePrompt}
      />
    </main>
  );
}

export default function HomePage(): React.JSX.Element {
  const firebaseContext = useContext(FirebaseContext);
  const { t } = useTranslation();
  const isLocalMode = process.env.NEXT_PUBLIC_STORAGE_BACKEND === 'local';

  if (!isLocalMode && !firebaseContext?.areServicesAvailable) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-headline font-bold mb-4">
            {t('firebaseConfigurationRequired')}
          </h1>
          <p className="text-muted-foreground mb-4">
            {t('firebaseConfigurationDescription')}{' '}
            <code className="bg-muted px-2 py-1 rounded text-sm">{t('envFile')}</code>{' '}
            {t('file')}
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

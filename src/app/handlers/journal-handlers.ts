import { format } from 'date-fns';
import type { StorageBackend } from '@/repositories/storage-backend';

const MIN_CONTENT_LENGTH_FOR_ANALYSIS = 50;

export function generateEntryId(dateKey: string): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  return `${dateKey}-${hours}${minutes}${seconds}${milliseconds}`;
}

interface TriggerAnalysisParams {
  content: string;
  entryId: string;
  backend: StorageBackend;
  analyze: (content: string) => Promise<{
    moods?: string[];
    moodEmojis?: Record<string, string>;
    subjectEmoji?: string;
    themes?: string[];
    themeEmojis?: Record<string, string>;
    keyTakeaways?: string[];
    places?: string[];
    characters?: string[];
  } | null>;
}

export function triggerEntryAnalysis(params: TriggerAnalysisParams): void {
  const { content, entryId, backend, analyze } = params;

  if (content.trim().length <= MIN_CONTENT_LENGTH_FOR_ANALYSIS) return;

  analyze(content).then((analysis) => {
    if (!analysis) return;

    backend.updateEntry(entryId, {
      moods: analysis.moods,
      moodEmojis: analysis.moodEmojis,
      subjectEmoji: analysis.subjectEmoji,
      themes: analysis.themes,
      themeEmojis: analysis.themeEmojis,
      keyTakeaways: analysis.keyTakeaways,
      places: analysis.places,
      characters: analysis.characters,
      aiProcessedAt: new Date().toISOString(),
    }).catch((err) => {
      console.error('Failed to save entry analysis:', { entryId, error: err });
    });
  }).catch((err) => {
    console.error('Failed to analyze entry:', {
      entryId,
      contentLength: content.length,
      error: err,
    });
  });
}

interface CreateEntryDocumentParams {
  entryId: string;
  content: string;
  title: string;
  dateKey: string;
  backend: StorageBackend;
}

export function createEntryDocument(params: CreateEntryDocumentParams): Promise<void> {
  const { entryId, content, title, dateKey, backend } = params;
  return backend.createEntry(entryId, {
    content,
    date: dateKey,
    ...(title ? { title } : {}),
  });
}

interface SaveSummaryParams {
  entryId: string;
  entryDateKey: string;
  summary: { content: string; title: string; insights?: string[] };
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  backend: StorageBackend;
  draftId?: string | null;
}

export function saveSummaryAsEntry(params: SaveSummaryParams): Promise<void> {
  const { entryId, entryDateKey, summary, conversationHistory, backend, draftId } = params;
  const finalEntryId = draftId || entryId;
  const conversationHistoryForStorage = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toISOString(),
  }));

  if (draftId) {
    return backend.updateEntry(finalEntryId, {
      content: summary.content,
      title: summary.title,
      date: entryDateKey,
      conversationMode: true,
      conversationHistory: conversationHistoryForStorage,
      summaryGeneratedAt: new Date().toISOString(),
      keyTakeaways: summary.insights,
      isDraft: false,
    });
  }

  return backend.createEntry(finalEntryId, {
    content: summary.content,
    title: summary.title,
    date: entryDateKey,
    conversationMode: true,
    conversationHistory: conversationHistoryForStorage,
    summaryGeneratedAt: new Date().toISOString(),
    keyTakeaways: summary.insights,
    isDraft: false,
  });
}

interface SaveConversationDraftParams {
  draftId: string | null;
  entryDateKey: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  backend: StorageBackend;
  forceCreate?: boolean;
}

export async function saveConversationDraft(params: SaveConversationDraftParams): Promise<string> {
  const { draftId, entryDateKey, conversationHistory, backend, forceCreate } = params;
  const conversationHistoryForStorage = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toISOString(),
  }));

  const finalDraftId = draftId || generateEntryId(entryDateKey);
  const draftPayload = {
    content: '',
    date: entryDateKey,
    conversationMode: true,
    isDraft: true,
    conversationHistory: conversationHistoryForStorage,
  };

  if (draftId && !forceCreate) {
    await backend.updateEntry(finalDraftId, draftPayload);
  } else {
    await backend.createEntry(finalDraftId, draftPayload);
  }

  return finalDraftId;
}

interface DeleteDraftParams {
  draftId: string;
  backend: StorageBackend;
}

export function deleteDraft(params: DeleteDraftParams): Promise<void> {
  const { draftId, backend } = params;
  return backend.deleteEntry(draftId);
}

interface UpdateConversationEntryParams {
  entryId: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  backend: StorageBackend;
}

export function updateConversationEntry(params: UpdateConversationEntryParams): Promise<void> {
  const { entryId, conversationHistory, backend } = params;
  const conversationHistoryForStorage = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toISOString(),
  }));

  return backend.updateEntry(entryId, {
    conversationHistory: conversationHistoryForStorage,
  });
}

interface ChangeEntryDateParams {
  entryId: string;
  newDate: Date;
  backend: StorageBackend;
}

export function changeEntryDate(params: ChangeEntryDateParams): Promise<void> {
  const { entryId, newDate, backend } = params;
  return backend.updateEntry(entryId, {
    date: format(newDate, 'yyyy-MM-dd'),
  });
}

interface CreateEntryLinkParams {
  fromEntryId: string;
  toEntryId: string;
  backend: StorageBackend;
}

export function createEntryLink(params: CreateEntryLinkParams): Promise<void> {
  const { fromEntryId, toEntryId, backend } = params;
  return backend.linkEntries(fromEntryId, toEntryId);
}

interface DeleteEntryLinkParams {
  fromEntryId: string;
  toEntryId: string;
  backend: StorageBackend;
}

export function deleteEntryLink(params: DeleteEntryLinkParams): Promise<void> {
  const { fromEntryId, toEntryId, backend } = params;
  return backend.unlinkEntries(fromEntryId, toEntryId);
}

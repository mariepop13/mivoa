import { doc, serverTimestamp, Timestamp, type Firestore } from 'firebase/firestore';
import { format } from 'date-fns';
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

const MIN_CONTENT_LENGTH_FOR_ANALYSIS = 50;

function convertConversationHistoryForStorage(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
): Array<{ role: 'user' | 'assistant'; content: string; timestamp: Timestamp }> {
  return conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: Timestamp.fromDate(msg.timestamp),
  }));
}

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
  firestore: Firestore;
  user: { uid: string };
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
  const { content, entryId, firestore, user, analyze } = params;
  
  if (content.trim().length <= MIN_CONTENT_LENGTH_FOR_ANALYSIS) return;

  analyze(content).then((analysis) => {
    if (!analysis) return;

    const analysisData: Record<string, unknown> = {
      moods: analysis.moods,
      moodEmojis: analysis.moodEmojis,
      subjectEmoji: analysis.subjectEmoji,
      themes: analysis.themes,
      themeEmojis: analysis.themeEmojis,
      keyTakeaways: analysis.keyTakeaways,
      places: analysis.places,
      characters: analysis.characters,
      aiProcessedAt: serverTimestamp(),
    };
    const entryDocRef = doc(firestore, `users/${user.uid}/entries/${entryId}`);
    updateDocumentNonBlocking(entryDocRef, analysisData).catch((err) => {
      console.error('Failed to save entry analysis:', {
        entryId,
        userId: user.uid,
        error: err
      });
    });
  }).catch((err) => {
    console.error('Failed to analyze entry:', {
      entryId,
      userId: user.uid,
      contentLength: content.length,
      error: err
    });
  });
}

interface CreateEntryDocumentParams {
  entryId: string;
  content: string;
  title: string;
  dateKey: string;
  firestore: Firestore;
  user: { uid: string };
}

export function createEntryDocument(params: CreateEntryDocumentParams): Promise<void> {
  const { entryId, content, title, dateKey, firestore, user } = params;
  const newDocRef = doc(firestore, `users/${user.uid}/entries/${entryId}`);
  const data: Record<string, unknown> = {
    content,
    date: dateKey,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (title) {
    data.title = title;
  }
  return setDocumentNonBlocking(newDocRef, data, {});
}

interface SaveSummaryParams {
  entryId: string;
  entryDateKey: string;
  summary: { content: string; title: string; insights?: string[] };
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  firestore: Firestore;
  user: { uid: string };
  draftId?: string | null;
}

export function saveSummaryAsEntry(params: SaveSummaryParams): Promise<void> {
  const { entryId, entryDateKey, summary, conversationHistory, firestore, user, draftId } = params;
  const finalEntryId = draftId || entryId;
  const entryDocRef = doc(firestore, `users/${user.uid}/entries/${finalEntryId}`);
  const conversationHistoryForStorage = convertConversationHistoryForStorage(conversationHistory);
  
  const data: Record<string, unknown> = {
    content: summary.content,
    title: summary.title,
    date: entryDateKey,
    updatedAt: serverTimestamp(),
    conversationMode: true,
    conversationHistory: conversationHistoryForStorage,
    summaryGeneratedAt: serverTimestamp(),
    keyTakeaways: summary.insights,
    isDraft: false,
  };

  if (!draftId) {
    data.createdAt = serverTimestamp();
  }

  return setDocumentNonBlocking(entryDocRef, data, {});
}

interface SaveConversationDraftParams {
  draftId: string | null;
  entryDateKey: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  firestore: Firestore;
  user: { uid: string };
}

export function saveConversationDraft(params: SaveConversationDraftParams): Promise<string> {
  const { draftId, entryDateKey, conversationHistory, firestore, user } = params;
  const conversationHistoryForStorage = convertConversationHistoryForStorage(conversationHistory);

  const finalDraftId = draftId || generateEntryId(entryDateKey);
  const draftDocRef = doc(firestore, `users/${user.uid}/entries/${finalDraftId}`);
  
  const data: Record<string, unknown> = {
    content: '',
    date: entryDateKey,
    conversationMode: true,
    isDraft: true,
    conversationHistory: conversationHistoryForStorage,
    updatedAt: serverTimestamp(),
  };

  if (!draftId) {
    data.createdAt = serverTimestamp();
  }

  return setDocumentNonBlocking(draftDocRef, data, {}).then(() => finalDraftId);
}

interface DeleteDraftParams {
  draftId: string;
  firestore: Firestore;
  user: { uid: string };
}

export function deleteDraft(params: DeleteDraftParams): Promise<void> {
  const { draftId, firestore, user } = params;
  const draftDocRef = doc(firestore, `users/${user.uid}/entries/${draftId}`);
  return deleteDocumentNonBlocking(draftDocRef);
}

interface UpdateConversationEntryParams {
  entryId: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  firestore: Firestore;
  user: { uid: string };
}

export function updateConversationEntry(params: UpdateConversationEntryParams): Promise<void> {
  const { entryId, conversationHistory, firestore, user } = params;
  const entryDocRef = doc(firestore, `users/${user.uid}/entries/${entryId}`);
  const conversationHistoryForStorage = convertConversationHistoryForStorage(conversationHistory);
  
  const data: Record<string, unknown> = {
    conversationHistory: conversationHistoryForStorage,
    updatedAt: serverTimestamp(),
  };

  return updateDocumentNonBlocking(entryDocRef, data);
}

interface ChangeEntryDateParams {
  entryId: string;
  newDate: Date;
  firestore: Firestore;
  user: { uid: string };
}

export function changeEntryDate(params: ChangeEntryDateParams): Promise<void> {
  const { entryId, newDate, firestore, user } = params;
  const entryDocRef = doc(firestore, `users/${user.uid}/entries/${entryId}`);
  const newDateKey = format(newDate, 'yyyy-MM-dd');
  
  const data: Record<string, unknown> = {
    date: newDateKey,
    updatedAt: serverTimestamp(),
  };

  return updateDocumentNonBlocking(entryDocRef, data);
}



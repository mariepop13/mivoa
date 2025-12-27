import { doc, serverTimestamp, Timestamp, type Firestore } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';

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
  firestore: Firestore;
  user: { uid: string };
  analyze: (content: string) => Promise<{ mood?: string; themes?: string[]; keyTakeaways?: string[] } | null>;
}

export function triggerEntryAnalysis(params: TriggerAnalysisParams): void {
  const { content, entryId, firestore, user, analyze } = params;
  
  if (content.trim().length <= MIN_CONTENT_LENGTH_FOR_ANALYSIS) return;

  analyze(content).then((analysis) => {
    if (!analysis) return;

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
  }).catch((err) => {
    console.error('Failed to analyze entry:', err);
  });
}

export function createEntryDocument(
  entryId: string,
  content: string,
  title: string,
  dateKey: string,
  firestore: Firestore,
  user: { uid: string }
): Promise<void> {
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

export function saveSummaryAsEntry(
  entryId: string,
  entryDateKey: string,
  summary: { content: string; title: string; insights?: string[] },
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>,
  firestore: Firestore,
  user: { uid: string }
): Promise<void> {
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
  return setDocumentNonBlocking(newDocRef, data, {});
}



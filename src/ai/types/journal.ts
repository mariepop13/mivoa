import { Timestamp } from 'firebase/firestore';

export interface RecentEntry {
  content: string;
  title?: string;
  date: string;
}

export interface JournalPrompt {
  text: string;
  category?: string;
  generatedAt: Date;
  dateKey: string;
}

export interface EntryAnalysis {
  mood?: string;
  emotions?: string[];
  themes?: string[];
  keyTakeaways?: string[];
  processedAt: Date;
}

export interface EntryMetadata {
  mood?: string;
  themes?: string[];
  keyTakeaways?: string[];
  aiProcessedAt?: Timestamp;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp | Date;
}


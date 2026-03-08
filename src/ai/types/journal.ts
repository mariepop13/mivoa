import { Timestamp } from 'firebase/firestore';

export interface RecentEntry {
  content: string;
  title?: string;
  date: string;
  moods?: string[];
  themes?: string[];
}

export interface JournalPrompt {
  text: string;
  category?: string;
  generatedAt: Date;
  dateKey: string;
}

export interface EntryAnalysis {
  moods?: string[];
  moodEmojis?: Record<string, string>;
  subjectEmoji?: string;
  emotions?: string[];
  themes?: string[];
  themeEmojis?: Record<string, string>;
  keyTakeaways?: string[];
  places?: string[];
  characters?: string[];
  processedAt: Date;
}

export interface EntryMetadata {
  moods?: string[];
  moodEmojis?: Record<string, string>;
  subjectEmoji?: string;
  themes?: string[];
  themeEmojis?: Record<string, string>;
  keyTakeaways?: string[];
  places?: string[];
  characters?: string[];
  aiProcessedAt?: Timestamp;
}


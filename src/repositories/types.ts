export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO 8601 — no Firebase Timestamp
}

export interface Entry {
  id: string;
  content: string;
  title?: string;
  date: string; // yyyy-MM-dd
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  isDraft?: boolean;
  conversationMode?: boolean;
  conversationHistory?: ConversationMessage[];
  summaryGeneratedAt?: string; // ISO 8601
  moods?: string[];
  moodEmojis?: Record<string, string>;
  subjectEmoji?: string;
  themes?: string[];
  themeEmojis?: Record<string, string>;
  keyTakeaways?: string[];
  places?: string[];
  characters?: string[];
  aiProcessedAt?: string; // ISO 8601
  linkedEntryIds?: string[];
}

export type EntryCreateData = Omit<Entry, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};
export type EntryUpdateData = Partial<Omit<Entry, 'id' | 'createdAt'>>;

export interface Settings {
  openRouterApiKey?: string;
  selectedModel?: string;
}

export type Unsubscribe = () => void;

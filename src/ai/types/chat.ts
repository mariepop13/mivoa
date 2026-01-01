import { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | Timestamp;
  editedAt?: Date | Timestamp;
}

export interface ConversationState {
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
}

export interface ConversationSummary {
  title: string;
  content: string;
  insights?: string[];
}



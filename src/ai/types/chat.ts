export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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



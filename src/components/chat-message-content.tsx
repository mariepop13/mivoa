'use client';

import { useContext } from 'react';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { LanguageContext } from '@/context/LanguageContext';
import type { ChatMessage } from '@/ai/types/chat';

interface ChatMessageContentProps {
  message: ChatMessage;
  isUser: boolean;
}

const markdownComponents: Partial<Components> = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="ml-2">{children}</li>
  ),
  code: ({ children, className }) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
    ) : (
      <code className="block bg-muted/50 p-2 rounded text-xs font-mono overflow-x-auto">{children}</code>
    );
  },
};

export function ChatMessageContent({
  message,
  isUser,
}: ChatMessageContentProps): React.JSX.Element {
  const { language } = useContext(LanguageContext);
  const dateLocale = language === 'fr' ? fr : enUS;
  const timestampDate = message.timestamp instanceof Timestamp
    ? message.timestamp.toDate()
    : message.timestamp;
  const formattedTime = format(timestampDate, 'HH:mm:ss', { locale: dateLocale });

  return (
    <div className="flex-1 min-w-0">
      <div className="text-sm break-words">
        <ReactMarkdown components={markdownComponents}>
          {message.content}
        </ReactMarkdown>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div
          className={`text-xs ${
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
}


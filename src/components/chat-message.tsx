'use client';

import { useContext, memo } from 'react';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType } from '@/ai/types/chat';
import { LanguageContext } from '@/context/LanguageContext';

interface ChatMessageProps {
  message: ChatMessageType;
}

const MAX_MESSAGE_WIDTH_PERCENT = 80;

function ChatMessageComponent({ message }: ChatMessageProps): React.JSX.Element {
  const { language } = useContext(LanguageContext);
  const dateLocale = language === 'fr' ? fr : enUS;
  const timestampDate = message.timestamp instanceof Timestamp 
    ? message.timestamp.toDate() 
    : message.timestamp;
  const formattedTime = format(timestampDate, 'HH:mm:ss', { locale: dateLocale });

  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        style={{ maxWidth: `${MAX_MESSAGE_WIDTH_PERCENT}%` }}
        className={`rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground border border-border'
        }`}
      >
        <div className="text-sm break-words">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="ml-2">{children}</li>,
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                ) : (
                  <code className="block bg-muted/50 p-2 rounded text-xs font-mono overflow-x-auto">{children}</code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
}

export const ChatMessage = memo(ChatMessageComponent);


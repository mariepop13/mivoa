'use client';

import type { ChatMessage as ChatMessageType } from '@/ai/types/chat';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useContext } from 'react';
import { LanguageContext } from '@/context/LanguageContext';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { language } = useContext(LanguageContext);
  const dateLocale = language === 'fr' ? fr : enUS;
  const formattedTime = format(message.timestamp, 'HH:mm:ss', { locale: dateLocale });

  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground border border-border'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
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


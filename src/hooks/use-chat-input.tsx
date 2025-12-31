import { useState, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';

interface UseChatInputParams {
  onSend: (message: string) => Promise<void>;
  isTyping: boolean;
}

interface UseChatInputResult {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSend: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  canSend: boolean;
}

export function useChatInput({ onSend, isTyping }: UseChatInputParams): UseChatInputResult {
  const [inputValue, setInputValue] = useState('');
  const { toast } = useToast();
  const { t } = useTranslation();
  const { apiKey, isLoading: isApiKeyLoading } = useContext(OpenRouterApiKeyContext);

  const handleSend = async (): Promise<void> => {
    if (!inputValue.trim() || isTyping) return;
    
    if (!isApiKeyLoading && !apiKey) {
      toast({
        variant: 'destructive',
        title: t('openRouterApiKeyRequired'),
        description: t('openRouterApiKeyRequiredDescription'),
      });
      return;
    }
    
    const messageToSend = inputValue;
    try {
      await onSend(messageToSend);
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        variant: 'destructive',
        title: t('messageSendError'),
        description: t('messageSendErrorDescription'),
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = Boolean(inputValue.trim() && !isTyping);

  return {
    inputValue,
    setInputValue,
    handleSend,
    handleKeyDown,
    canSend,
  };
}


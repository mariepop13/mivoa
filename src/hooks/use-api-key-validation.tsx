import { useState } from 'react';
import { validateOpenRouterApiKey } from '@/lib/openrouter-client';

interface UseApiKeyValidationResult {
  localApiKey: string;
  setLocalApiKey: (key: string) => void;
  isVerifying: boolean;
  handleSubmit: (e: React.FormEvent, onSubmit: (apiKey: string) => Promise<void>, onError: (message: string) => void) => Promise<void>;
}

export function useApiKeyValidation(): UseApiKeyValidationResult {
  const [localApiKey, setLocalApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent,
    onSubmit: (apiKey: string) => Promise<void>,
    onError: (_message: string) => void
  ): Promise<void> => {
    e.preventDefault();
    if (!localApiKey.trim()) {
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await validateOpenRouterApiKey(localApiKey.trim());
      if (isValid) {
        await onSubmit(localApiKey.trim());
        setLocalApiKey('');
      } else {
        onError('Invalid API key');
      }
    } catch (error) {
      console.error('Error validating or saving OpenRouter API key', error);
      onError('Invalid API key');
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    localApiKey,
    setLocalApiKey,
    isVerifying,
    handleSubmit,
  };
}


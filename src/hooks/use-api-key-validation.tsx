import { useContext, useState } from 'react';
import { validateOpenRouterApiKey } from '@/lib/openrouter-client';
import { FirebaseContext } from '@/firebase';

interface UseApiKeyValidationResult {
  localApiKey: string;
  setLocalApiKey: (key: string) => void;
  isVerifying: boolean;
  handleSubmit: (e: React.FormEvent, onSubmit: (apiKey: string) => Promise<void>, onError: (message: string) => void) => Promise<void>;
}

export function useApiKeyValidation(): UseApiKeyValidationResult {
  const [localApiKey, setLocalApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const firebaseCtx = useContext(FirebaseContext);

  const handleSubmit = async (
    e: React.FormEvent,
    onSubmit: (apiKey: string) => Promise<void>,
    onError: (_message: string) => void
  ): Promise<void> => {
    e.preventDefault();
    if (!localApiKey.trim()) return;

    setIsVerifying(true);
    try {
      const idToken = await firebaseCtx?.auth?.currentUser?.getIdToken();

      if (idToken) {
        const isValid = await validateOpenRouterApiKey(localApiKey.trim(), idToken);
        if (!isValid) {
          onError('Invalid API key');
          return;
        }
      }

      await onSubmit(localApiKey.trim());
      setLocalApiKey('');
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

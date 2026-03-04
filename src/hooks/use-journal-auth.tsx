import { useStorage } from '@/repositories/storage-provider';
import type { AppUser } from '@/repositories/types';

interface UseJournalAuthResult {
  authError: string | null;
  authLoading: boolean;
  user: AppUser | null;
}

export function useJournalAuth(): UseJournalAuthResult {
  const { user, isUserLoading: authLoading } = useStorage();

  return {
    authError: null,
    authLoading,
    user,
  };
}

import { useStorage } from '@/repositories/storage-provider';
import type { AppUser } from '@/repositories/types';

interface UseJournalAuthResult {
  authLoading: boolean;
  user: AppUser | null;
}

export function useJournalAuth(): UseJournalAuthResult {
  const { user, isUserLoading: authLoading } = useStorage();

  return {
    authLoading,
    user,
  };
}

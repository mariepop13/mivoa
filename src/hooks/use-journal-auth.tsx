import { useUser } from '@/firebase/auth/use-user';

interface UseJournalAuthResult {
  authError: string | null;
  authLoading: boolean;
  user: ReturnType<typeof useUser>['user'];
}

export function useJournalAuth(): UseJournalAuthResult {
  const { user, isLoading: authLoading, error } = useUser();

  return {
    authError: error ? error.message : null,
    authLoading,
    user,
  };
}


import { useUser } from '@/firebase/auth/use-user';

interface UseJournalAuthResult {
  authError: null;
  authLoading: boolean;
  user: ReturnType<typeof useUser>['user'];
}

export function useJournalAuth(): UseJournalAuthResult {
  const { user, isLoading: authLoading } = useUser();

  return {
    authError: null,
    authLoading,
    user,
  };
}


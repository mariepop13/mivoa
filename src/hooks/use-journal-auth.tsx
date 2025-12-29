import { useUser } from '@/firebase/auth/use-user';

export function useJournalAuth() {
  const { user, isLoading: authLoading } = useUser();

  return {
    authError: null,
    authLoading,
    user,
  };
}


'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStorage } from '@/repositories/storage-provider';
import { JournalLoadingState } from '@/components/journal-loading-state';

const PUBLIC_ROUTES = ['/auth', '/about', '/contact', '/legal', '/privacy', '/terms', '/test-auth'];

export function AuthGuard({ children }: { children: ReactNode }): React.JSX.Element {
  const { user, isUserLoading: isLoading } = useStorage();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && !PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
      router.replace('/auth');
    }
  }, [user, isLoading, pathname, router]);

  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r));
  if (!isPublicRoute && (isLoading || !user)) return <JournalLoadingState />;
  return <>{children}</>;
}

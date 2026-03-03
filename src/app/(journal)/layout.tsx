import { ReactNode } from 'react';
import { ApiKeyGuard } from '@/components/api-key-guard';

export default function JournalLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return <ApiKeyGuard>{children}</ApiKeyGuard>;
}

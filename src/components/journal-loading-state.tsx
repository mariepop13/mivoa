'use client';

import { Loader } from 'lucide-react';

export function JournalLoadingState(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Loader className="app-loader" />
    </main>
  );
}


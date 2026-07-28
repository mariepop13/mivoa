'use client';

import Link from 'next/link';
import { type ReactElement, useEffect, useState } from 'react';
import { seedDevData, type SeedDevDataResult, type SeedMode } from '@/lib/seed-dev-data';

type SeedState = 'seeding' | 'done' | 'error';

function readSeedMode(): SeedMode {
  if (typeof window === 'undefined') return 'reset';

  return new URLSearchParams(window.location.search).get('mode') === 'append' ? 'append' : 'reset';
}

export function DevSeedClient(): ReactElement {
  const [state, setState] = useState<SeedState>('seeding');
  const [result, setResult] = useState<SeedDevDataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    seedDevData({ mode: readSeedMode() })
      .then((seedResult) => {
        setResult(seedResult);
        setState('done');
      })
      .catch((err: unknown) => {
        setState('error');
        setError(err instanceof Error ? err.message : 'Unexpected error');
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 font-mono text-sm">
      {state === 'seeding' && <p className="text-muted-foreground">Seeding Mivoa dev data...</p>}
      {state === 'done' && result && (
        <>
          <p className="text-green-600">
            Seeded {result.entriesCreated} entries in {result.mode} mode.
          </p>
          <div className="flex gap-4">
            <Link href="/" className="underline">
              Go to journal
            </Link>
            <Link href="/dev/seed?mode=append" className="underline">
              Append seed
            </Link>
          </div>
        </>
      )}
      {state === 'error' && <p className="text-destructive">Seed failed: {error}</p>}
    </main>
  );
}

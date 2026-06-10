import { DEV_OPENROUTER_API_KEY, SELF_REFLECTION_DEMO_ENTRIES } from '@/dev/self-reflection-demo-seed';
import { DEFAULT_MODEL } from '@/context/ModelContext';
import { LocalStorageBackend } from '@/repositories/local-storage-backend';
import type { Entry, Settings } from '@/repositories/types';

export const SEED_ENTRY_IDS = SELF_REFLECTION_DEMO_ENTRIES.map((entry) => entry.id);
export const SEED_SELECTED_MODEL = DEFAULT_MODEL;
export const SEED_SETTINGS: Settings = {
  openRouterApiKey: DEV_OPENROUTER_API_KEY,
  selectedModel: SEED_SELECTED_MODEL,
};

export type SeedMode = 'reset' | 'append';

export interface SeedDevDataOptions {
  mode?: SeedMode;
}

export interface SeedDevDataResult {
  mode: SeedMode;
  entriesCreated: number;
  settingsSeeded: boolean;
}

const APP_STORAGE_KEY_PREFIXES = ['mivoa:', 'mivoa-', 'journal_prompt_'];

function clearMivoaStorage(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove = Array.from({ length: window.localStorage.length }, (_, index) =>
    window.localStorage.key(index)
  ).filter((key): key is string =>
    Boolean(key && APP_STORAGE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)))
  );

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

async function upsertSeedEntries(backend: LocalStorageBackend, entries: Entry[]): Promise<void> {
  await Promise.all(
    entries.map(({ id, createdAt, updatedAt, ...data }) =>
      backend.createEntry(id, { ...data, createdAt, updatedAt })
    )
  );
}

export async function seedDevData(options: SeedDevDataOptions = {}): Promise<SeedDevDataResult> {
  const mode = options.mode ?? 'reset';

  if (mode === 'reset') {
    clearMivoaStorage();
  }

  const backend = new LocalStorageBackend();
  await upsertSeedEntries(backend, SELF_REFLECTION_DEMO_ENTRIES);
  await backend.updateSettings(SEED_SETTINGS);

  return {
    mode,
    entriesCreated: SELF_REFLECTION_DEMO_ENTRIES.length,
    settingsSeeded: true,
  };
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntryLinkDialog } from '../entry-link-dialog';
import { useAllEntries } from '@/repositories/storage-provider';
import { useTranslation } from '@/hooks/use-translation';
import type { Entry } from '@/repositories/types';

vi.mock('@/repositories/storage-provider', () => ({
  useAllEntries: vi.fn(),
}));

vi.mock('@/hooks/use-translation', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('@/utils/entry-linking-utils', () => ({
  getEntryPreview: (content: string) => content.slice(0, 50),
  parseEntryDate: (date: string) => new Date(date),
}));

const mockEntries: Entry[] = [
  {
    id: 'entry-1',
    content: 'First entry content',
    title: 'First Entry',
    date: '2026-01-01',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'entry-2',
    content: 'Second entry content',
    title: 'Second Entry',
    date: '2026-01-02',
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-01-02T10:00:00Z',
  },
  {
    id: 'draft-1',
    content: 'Draft content',
    date: '2026-01-03',
    createdAt: '2026-01-03T10:00:00Z',
    updatedAt: '2026-01-03T10:00:00Z',
    isDraft: true,
  },
];

describe('EntryLinkDialog', () => {
  const onOpenChange = vi.fn();
  const onSelectEntries = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string) => key,
      language: 'en',
      isLoading: false,
      error: null,
    });
    vi.mocked(useAllEntries).mockReturnValue({ data: mockEntries, isLoading: false });
  });

  it('renders nothing when closed', () => {
    render(
      <EntryLinkDialog
        open={false}
        onOpenChange={onOpenChange}
        currentEntryId="current"
        onSelectEntries={onSelectEntries}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useAllEntries).mockReturnValue({ data: null, isLoading: true });
    render(
      <EntryLinkDialog
        open={true}
        onOpenChange={onOpenChange}
        currentEntryId="current"
        onSelectEntries={onSelectEntries}
      />
    );
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('filters out current entry and drafts', () => {
    render(
      <EntryLinkDialog
        open={true}
        onOpenChange={onOpenChange}
        currentEntryId="entry-1"
        onSelectEntries={onSelectEntries}
      />
    );
    expect(screen.queryByText('First Entry')).not.toBeInTheDocument();
    expect(screen.queryByText('Draft content')).not.toBeInTheDocument();
    expect(screen.getByText('Second Entry')).toBeInTheDocument();
  });

  it('filters out already linked entries', () => {
    render(
      <EntryLinkDialog
        open={true}
        onOpenChange={onOpenChange}
        currentEntryId="current"
        linkedEntryIds={['entry-1']}
        onSelectEntries={onSelectEntries}
      />
    );
    expect(screen.queryByText('First Entry')).not.toBeInTheDocument();
    expect(screen.getByText('Second Entry')).toBeInTheDocument();
  });

  it('filters entries by search query', () => {
    render(
      <EntryLinkDialog
        open={true}
        onOpenChange={onOpenChange}
        currentEntryId="current"
        onSelectEntries={onSelectEntries}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'First' } });
    expect(screen.getByText('First Entry')).toBeInTheDocument();
    expect(screen.queryByText('Second Entry')).not.toBeInTheDocument();
  });

  it('shows no entries message when search yields no results', () => {
    render(
      <EntryLinkDialog
        open={true}
        onOpenChange={onOpenChange}
        currentEntryId="current"
        onSelectEntries={onSelectEntries}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'xxxxxxx' } });
    expect(screen.getByText('noEntriesFound')).toBeInTheDocument();
  });

  it('calls onSelectEntries with selected ids on confirm', () => {
    render(
      <EntryLinkDialog
        open={true}
        onOpenChange={onOpenChange}
        currentEntryId="current"
        onSelectEntries={onSelectEntries}
      />
    );
    fireEvent.click(screen.getByText('First Entry'));
    fireEvent.click(screen.getByRole('button', { name: /linkEntry/i }));
    expect(onSelectEntries).toHaveBeenCalledWith(['entry-1']);
  });

  it('does not call onSelectEntries when nothing selected', () => {
    render(
      <EntryLinkDialog
        open={true}
        onOpenChange={onOpenChange}
        currentEntryId="current"
        onSelectEntries={onSelectEntries}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /linkEntry/i }));
    expect(onSelectEntries).not.toHaveBeenCalled();
  });

  it('calls onOpenChange on cancel', () => {
    render(
      <EntryLinkDialog
        open={true}
        onOpenChange={onOpenChange}
        currentEntryId="current"
        onSelectEntries={onSelectEntries}
      />
    );
    fireEvent.click(screen.getByText('cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

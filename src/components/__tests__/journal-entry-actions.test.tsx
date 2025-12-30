import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalEntryActions } from '../journal-entry-actions';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-translation');

describe('JournalEntryActions', () => {
  const mockT = vi.fn((key: string) => key);
  const mockOnSave = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
  });

  it('should render save button', () => {
    render(
      <JournalEntryActions
        onSave={mockOnSave}
        isLoading={false}
        canDelete={false}
      />
    );

    expect(screen.getByText('save')).toBeInTheDocument();
  });

  it('should call onSave when save button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <JournalEntryActions
        onSave={mockOnSave}
        isLoading={false}
        canDelete={false}
      />
    );

    const saveButton = screen.getByText('save');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('should render delete button when canDelete is true and onDelete is provided', () => {
    render(
      <JournalEntryActions
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        isLoading={false}
        canDelete={true}
      />
    );

    expect(screen.getByText('delete')).toBeInTheDocument();
  });

  it('should not render delete button when canDelete is false', () => {
    render(
      <JournalEntryActions
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        isLoading={false}
        canDelete={false}
      />
    );

    expect(screen.queryByText('delete')).not.toBeInTheDocument();
  });

  it('should not render delete button when onDelete is not provided', () => {
    render(
      <JournalEntryActions
        onSave={mockOnSave}
        isLoading={false}
        canDelete={true}
      />
    );

    expect(screen.queryByText('delete')).not.toBeInTheDocument();
  });

  it('should open confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <JournalEntryActions
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        isLoading={false}
        canDelete={true}
      />
    );

    const deleteButton = screen.getByText('delete');
    await user.click(deleteButton);

    expect(screen.getByText('confirmDelete')).toBeInTheDocument();
    expect(screen.getByText('cancel')).toBeInTheDocument();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should call onDelete when delete is confirmed in dialog', async () => {
    const user = userEvent.setup();
    render(
      <JournalEntryActions
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        isLoading={false}
        canDelete={true}
      />
    );

    const deleteButton = screen.getByText('delete');
    await user.click(deleteButton);

    const dialog = await waitFor(() => {
      return screen.getByRole('alertdialog');
    });

    const confirmButton = dialog.querySelector('button[class*="bg-destructive"]') as HTMLButtonElement;
    
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton?.textContent).toBe('delete');
    
    await user.click(confirmButton);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should not call onDelete when cancel is clicked in dialog', async () => {
    const user = userEvent.setup();
    render(
      <JournalEntryActions
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        isLoading={false}
        canDelete={true}
      />
    );

    const deleteButton = screen.getByText('delete');
    await user.click(deleteButton);

    const cancelButton = screen.getByText('cancel');
    await user.click(cancelButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should disable buttons when isLoading is true', () => {
    render(
      <JournalEntryActions
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        isLoading={true}
        canDelete={true}
      />
    );

    const saveButton = screen.getByText('save');
    const deleteButton = screen.getByText('delete');

    expect(saveButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  it('should enable buttons when isLoading is false', () => {
    render(
      <JournalEntryActions
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        isLoading={false}
        canDelete={true}
      />
    );

    const saveButton = screen.getByText('save');
    const deleteButton = screen.getByText('delete');

    expect(saveButton).not.toBeDisabled();
    expect(deleteButton).not.toBeDisabled();
  });
});


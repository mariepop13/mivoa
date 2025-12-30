import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalEntry } from '../journal-entry';

const mockProps = {
  date: new Date('2024-01-15'),
  content: 'Test journal entry content',
  title: 'Test Entry',
  onContentChange: vi.fn(),
  onSave: vi.fn(),
  onDelete: vi.fn(),
  isLoading: false,
  isSaved: false,
  error: null,
  hideDate: false,
  canDelete: true,
  recentEntries: [],
};

describe('JournalEntry', () => {
  it('renders entry with title and content', () => {
    render(<JournalEntry {...mockProps} />);
    
    expect(screen.getByText('Test Entry')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test journal entry content')).toBeInTheDocument();
  });

  it('calls onContentChange when textarea value changes', () => {
    render(<JournalEntry {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText('writeYourThoughts');
    fireEvent.change(textarea, { target: { value: 'New content' } });
    
    expect(mockProps.onContentChange).toHaveBeenCalledWith('New content');
  });

  it('calls onSave when save button is clicked', () => {
    render(<JournalEntry {...mockProps} />);
    
    const saveButton = screen.getByText(/save/i);
    fireEvent.click(saveButton);
    
    expect(mockProps.onSave).toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<JournalEntry {...mockProps} />);
    
    const deleteButton = screen.getByText(/delete/i);
    await user.click(deleteButton);
    
    const dialog = await waitFor(() => {
      return screen.getByRole('alertdialog');
    });

    const confirmButton = within(dialog).getByRole('button', { name: /delete/i });
    
    expect(confirmButton).toBeInTheDocument();
    
    await user.click(confirmButton);
    expect(mockProps.onDelete).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(<JournalEntry {...mockProps} isLoading={true} />);
    
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
    expect(screen.getByText(/save/i)).toBeDisabled();
  });

  it('shows saved state when isSaved is true', () => {
    render(<JournalEntry {...mockProps} isSaved={true} />);
    
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });

  it('displays error message when error is provided', () => {
    render(<JournalEntry {...mockProps} error="Test error message" />);
    
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });

  it('hides date when hideDate is true', () => {
    render(<JournalEntry {...mockProps} hideDate={true} />);
    
    expect(screen.queryByText(/january/i)).not.toBeInTheDocument();
  });

  it('hides delete button when canDelete is false', () => {
    render(<JournalEntry {...mockProps} canDelete={false} />);
    
    expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
  });

  it('renders without title when title is not provided', () => {
    render(<JournalEntry {...mockProps} title="" />);
    
    expect(screen.queryByText('Test Entry')).not.toBeInTheDocument();
  });
});


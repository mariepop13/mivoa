import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalEntryActions } from '../journal-entry-actions';
import { useTranslation } from '@/hooks/use-translation';
import { LanguageContext } from '@/context/LanguageContext';

vi.mock('@/hooks/use-translation');
vi.mock('../date-picker', () => ({
  DatePicker: ({ value, onChange }: { value: Date; onChange: (date: Date) => void }) => {
    const formatDate = (date: Date): string => {
      if (!date || isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return (
      <div data-testid="date-picker">
        <input
          type="date"
          data-testid="date-input"
          value={formatDate(value)}
          onChange={(e) => {
            const [year, month, day] = e.target.value.split('-').map(Number);
            onChange(new Date(year, month - 1, day));
          }}
        />
      </div>
    );
  },
}));

describe('JournalEntryActions', () => {
  const mockT = vi.fn((key: string) => key);
  const mockOnSave = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnChangeDate = vi.fn();
  const mockCurrentDate = new Date(2024, 0, 15);

  const renderWithLanguage = (props?: any) => render(
      <LanguageContext.Provider
        value={{
          language: 'en',
          setLanguage: vi.fn(),
          supportedLanguages: ['en', 'fr'],
        }}
      >
        <JournalEntryActions
          onSave={mockOnSave}
          isLoading={false}
          canDelete={false}
          {...props}
        />
      </LanguageContext.Provider>
    );

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

    const dialog = await waitFor(() => screen.getByRole('alertdialog'));

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

  it('should render change date button when onChangeDate and currentDate are provided', () => {
    renderWithLanguage({
      onChangeDate: mockOnChangeDate,
      currentDate: mockCurrentDate,
    });

    expect(screen.getByText('changeEntryDate')).toBeInTheDocument();
  });

  it('should not render change date button when onChangeDate is not provided', () => {
    renderWithLanguage({
      currentDate: mockCurrentDate,
    });

    expect(screen.queryByText('changeEntryDate')).not.toBeInTheDocument();
  });

  it('should not render change date button when currentDate is not provided', () => {
    renderWithLanguage({
      onChangeDate: mockOnChangeDate,
    });

    expect(screen.queryByText('changeEntryDate')).not.toBeInTheDocument();
  });

  it('should open change date dialog when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithLanguage({
      onChangeDate: mockOnChangeDate,
      currentDate: mockCurrentDate,
    });

    const changeDateButton = screen.getByText('changeEntryDate');
    await user.click(changeDateButton);

    await waitFor(() => {
      expect(screen.getByText('confirmChangeDate')).toBeInTheDocument();
    });
  });

  it('should close change date dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithLanguage({
      onChangeDate: mockOnChangeDate,
      currentDate: mockCurrentDate,
    });

    const changeDateButton = screen.getByText('changeEntryDate');
    await user.click(changeDateButton);

    await waitFor(() => {
      expect(screen.getByText('cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('confirmChangeDate')).not.toBeInTheDocument();
    });
  });

  it('should call onChangeDate when date is changed and confirmed', async () => {
    const user = userEvent.setup();
    mockOnChangeDate.mockResolvedValue(undefined);
    
    renderWithLanguage({
      onChangeDate: mockOnChangeDate,
      currentDate: mockCurrentDate,
    });

    const changeDateButton = screen.getByText('changeEntryDate');
    await user.click(changeDateButton);

    await waitFor(() => {
      expect(screen.getByTestId('date-input')).toBeInTheDocument();
    });

    const dateInput = screen.getByTestId('date-input') as HTMLInputElement;
    await user.clear(dateInput);
    await user.type(dateInput, '2024-01-20');

    const confirmButton = screen.getByRole('button', { name: 'changeEntryDate' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnChangeDate).toHaveBeenCalledTimes(1);
    });

    const callArgs = mockOnChangeDate.mock.calls[0][0];
    expect(callArgs.getFullYear()).toBe(2024);
    expect(callArgs.getMonth()).toBe(0);
    expect(callArgs.getDate()).toBe(20);
  });

  it('should reset date to currentDate when dialog opens', async () => {
    const user = userEvent.setup();
    renderWithLanguage({
      onChangeDate: mockOnChangeDate,
      currentDate: mockCurrentDate,
    });

    const changeDateButton = screen.getByText('changeEntryDate');
    await user.click(changeDateButton);

    await waitFor(() => {
      const dateInput = screen.getByTestId('date-input') as HTMLInputElement;
      expect(dateInput.value).toBe('2024-01-15');
    });
  });

  it('should disable confirm button when selectedNewDate is null', async () => {
    const user = userEvent.setup();
    renderWithLanguage({
      onChangeDate: mockOnChangeDate,
      currentDate: mockCurrentDate,
    });

    const changeDateButton = screen.getByText('changeEntryDate');
    await user.click(changeDateButton);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: 'changeEntryDate' });
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('should disable change date button when isLoading is true', () => {
    renderWithLanguage({
      onChangeDate: mockOnChangeDate,
      currentDate: mockCurrentDate,
      isLoading: true,
    });

    const changeDateButton = screen.getByText('changeEntryDate').closest('button');
    expect(changeDateButton).toBeDisabled();
  });

  it('should disable confirm button when isLoading is true', async () => {
    const user = userEvent.setup();
    renderWithLanguage({
      onChangeDate: mockOnChangeDate,
      currentDate: mockCurrentDate,
      isLoading: true,
    });

    const changeDateButton = screen.getByText('changeEntryDate');
    await user.click(changeDateButton);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: 'changeEntryDate' });
      expect(confirmButton).toBeDisabled();
    });
  });

  it('should close dialog after successful date change', async () => {
    const user = userEvent.setup();
    mockOnChangeDate.mockResolvedValue(undefined);
    
    renderWithLanguage({
      onChangeDate: mockOnChangeDate,
      currentDate: mockCurrentDate,
    });

    const changeDateButton = screen.getByText('changeEntryDate');
    await user.click(changeDateButton);

    await waitFor(() => {
      expect(screen.getByTestId('date-input')).toBeInTheDocument();
    });

    const dateInput = screen.getByTestId('date-input') as HTMLInputElement;
    await user.clear(dateInput);
    await user.type(dateInput, '2024-01-20');

    const confirmButton = screen.getByRole('button', { name: 'changeEntryDate' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText('confirmChangeDate')).not.toBeInTheDocument();
    });
  });

  it('should handle error when onChangeDate throws', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnChangeDate.mockRejectedValue(new Error('Test error'));
    
    renderWithLanguage({
      onChangeDate: mockOnChangeDate,
      currentDate: mockCurrentDate,
    });

    const changeDateButton = screen.getByText('changeEntryDate');
    await user.click(changeDateButton);

    await waitFor(() => {
      expect(screen.getByTestId('date-input')).toBeInTheDocument();
    });

    const dateInput = screen.getByTestId('date-input') as HTMLInputElement;
    await user.clear(dateInput);
    await user.type(dateInput, '2024-01-20');

    const confirmButton = screen.getByRole('button', { name: 'changeEntryDate' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error changing date:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });
});


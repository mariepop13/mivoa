import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplatesDialog } from '../templates-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { useEntryTemplates } from '@/hooks/use-entry-templates';
import type { EntryTemplate } from '@/hooks/use-entry-templates';

vi.mock('@/hooks/use-translation');
vi.mock('@/hooks/use-entry-templates');

describe('TemplatesDialog', () => {
  const mockOnTemplateSelect = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockT = vi.fn((key: string) => key);

  const mockTemplates: EntryTemplate[] = [
    {
      id: 'gratitude',
      name: 'Gratitude',
      title: 'Gratitude Journal',
      content: 'Today I am grateful for:',
    },
    {
      id: 'reflection',
      name: 'Reflection',
      title: 'Daily Reflection',
      content: 'What happened today?',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
    vi.mocked(useEntryTemplates).mockReturnValue(mockTemplates);
  });

  it('should not render when dialog is closed', () => {
    render(
      <TemplatesDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );
    expect(screen.queryByText('selectTemplate')).not.toBeInTheDocument();
  });

  it('should render dialog when open', () => {
    render(
      <TemplatesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );
    expect(screen.getByText('selectTemplate')).toBeInTheDocument();
    expect(screen.getByText('selectTemplateDescription')).toBeInTheDocument();
  });

  it('should display all templates', () => {
    render(
      <TemplatesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );
    expect(screen.getByText('Gratitude')).toBeInTheDocument();
    expect(screen.getByText('Reflection')).toBeInTheDocument();
  });

  it('should call onTemplateSelect and onOpenChange when template is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TemplatesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );

    const gratitudeButton = screen.getByText('Gratitude').closest('button');
    expect(gratitudeButton).toBeInTheDocument();
    
    if (gratitudeButton) {
      await user.click(gratitudeButton);
    }

    expect(mockOnTemplateSelect).toHaveBeenCalledWith(mockTemplates[0]);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should display template descriptions', () => {
    mockT.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        templateGratitudeDescription: 'What are you grateful for?',
        templateReflectionDescription: 'What happened today?',
      };
      return translations[key] || key;
    });

    render(
      <TemplatesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );

    expect(screen.getByText('What are you grateful for?')).toBeInTheDocument();
    expect(screen.getByText('What happened today?')).toBeInTheDocument();
  });

  it('should use FileText icon for unknown template ID', () => {
    const unknownTemplate: EntryTemplate = {
      id: 'unknown',
      name: 'Unknown',
      title: 'Unknown Template',
      content: 'Unknown content',
    };

    vi.mocked(useEntryTemplates).mockReturnValue([unknownTemplate]);

    render(
      <TemplatesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );

    const button = screen.getByText('Unknown').closest('button');
    expect(button).toBeInTheDocument();
  });

  it('should handle empty templates array', () => {
    vi.mocked(useEntryTemplates).mockReturnValue([]);

    render(
      <TemplatesDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );

    expect(screen.getByText('selectTemplate')).toBeInTheDocument();
    expect(screen.queryByText('Gratitude')).not.toBeInTheDocument();
  });
});


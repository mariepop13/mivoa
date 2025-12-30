import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplatePromptDialog } from '../template-prompt-dialog';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/use-translation';
import { useModel } from '@/context/ModelContext';
import { generateTemplatePrompt } from '@/ai/services/journal-prompt-service';
import type { EntryTemplate } from '@/hooks/use-entry-templates';

vi.mock('@/hooks/use-translation');
vi.mock('@/context/ModelContext');
vi.mock('@/ai/services/journal-prompt-service');

describe('TemplatePromptDialog', () => {
  const mockOnUsePrompt = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockT = vi.fn((key: string) => key);
  const mockSetSelectedModel = vi.fn();
  const mockGenerateTemplatePrompt = vi.mocked(generateTemplatePrompt);

  const mockTemplate: EntryTemplate = {
    id: 'gratitude',
    name: 'Gratitude',
    title: 'Gratitude Journal',
    content: 'Today I am grateful for:',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
    vi.mocked(useModel).mockReturnValue({
      selectedModel: 'test-model',
      setSelectedModel: mockSetSelectedModel,
      isLoading: false,
    });
    mockGenerateTemplatePrompt.mockResolvedValue('Generated prompt text');
  });

  const renderWithContext = (open: boolean, template: EntryTemplate | null, apiKey: string | null) => {
    return render(
      <OpenRouterApiKeyContext.Provider
        value={{
          apiKey,
          setApiKey: vi.fn(),
          resetApiKey: vi.fn(),
          isLoading: false,
        }}
      >
        <LanguageContext.Provider value={{ language: 'en', setLanguage: vi.fn(), supportedLanguages: ['en', 'fr'] }}>
          <TemplatePromptDialog
            open={open}
            onOpenChange={mockOnOpenChange}
            template={template}
            onUsePrompt={mockOnUsePrompt}
          />
        </LanguageContext.Provider>
      </OpenRouterApiKeyContext.Provider>
    );
  };

  it('should not render when template is null', () => {
    renderWithContext(true, null, 'test-key');
    expect(screen.queryByText('templatePromptTitle')).not.toBeInTheDocument();
  });

  it('should not render when dialog is closed', () => {
    renderWithContext(false, mockTemplate, 'test-key');
    expect(screen.queryByText('templatePromptTitle')).not.toBeInTheDocument();
  });

  it('should display loading state while generating prompt', async () => {
    mockGenerateTemplatePrompt.mockImplementation(() => new Promise(() => {}));
    renderWithContext(true, mockTemplate, 'test-key');

    expect(screen.getByText('generatingTemplatePrompt')).toBeInTheDocument();
  });

  it('should display error when API key is missing', async () => {
    renderWithContext(true, mockTemplate, null);

    await waitFor(() => {
      expect(screen.getByText('openRouterApiKeyRequired')).toBeInTheDocument();
    });
  });

  it('should generate and display prompt when dialog opens', async () => {
    renderWithContext(true, mockTemplate, 'test-key');

    await waitFor(() => {
      expect(mockGenerateTemplatePrompt).toHaveBeenCalledWith({
        template: mockTemplate,
        apiKey: 'test-key',
        language: 'en',
        model: 'test-model',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('templateGratitudeDescription')).toBeInTheDocument();
    });
  });

  it('should call onUsePrompt when use button is clicked', async () => {
    const user = userEvent.setup();
    renderWithContext(true, mockTemplate, 'test-key');

    await waitFor(() => {
      expect(screen.getByText('useThisPrompt')).toBeInTheDocument();
    });

    const useButton = screen.getByText('useThisPrompt');
    await user.click(useButton);

    expect(mockOnUsePrompt).toHaveBeenCalledWith('Generated prompt text');
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should call onOpenChange when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithContext(true, mockTemplate, 'test-key');

    await waitFor(() => {
      expect(screen.getByText('cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('cancel');
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should display error message when generation fails', async () => {
    const error = new Error('Generation failed');
    mockGenerateTemplatePrompt.mockRejectedValue(error);
    renderWithContext(true, mockTemplate, 'test-key');

    await waitFor(() => {
      expect(screen.getByText('Generation failed')).toBeInTheDocument();
    });
  });

  it('should handle non-Error exception during generation', async () => {
    mockGenerateTemplatePrompt.mockRejectedValue('String error');
    renderWithContext(true, mockTemplate, 'test-key');

    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  it('should disable use button when prompt is empty', async () => {
    renderWithContext(true, mockTemplate, 'test-key');

    await waitFor(() => {
      const useButton = screen.getByText('useThisPrompt');
      expect(useButton).toBeDisabled();
    });

    await waitFor(() => {
      const useButton = screen.getByText('useThisPrompt');
      expect(useButton).not.toBeDisabled();
    });
  });

  it('should regenerate prompt when dialog is reopened after closing', async () => {
    const { rerender } = renderWithContext(true, mockTemplate, 'test-key');

    await waitFor(() => {
      expect(mockGenerateTemplatePrompt).toHaveBeenCalledTimes(1);
    });

    vi.clearAllMocks();

    rerender(
      <OpenRouterApiKeyContext.Provider
        value={{
          apiKey: 'test-key',
          setApiKey: vi.fn(),
          resetApiKey: vi.fn(),
          isLoading: false,
        }}
      >
        <LanguageContext.Provider value={{ language: 'en', setLanguage: vi.fn(), supportedLanguages: ['en', 'fr'] }}>
          <TemplatePromptDialog
            open={false}
            onOpenChange={mockOnOpenChange}
            template={mockTemplate}
            onUsePrompt={mockOnUsePrompt}
          />
        </LanguageContext.Provider>
      </OpenRouterApiKeyContext.Provider>
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    rerender(
      <OpenRouterApiKeyContext.Provider
        value={{
          apiKey: 'test-key',
          setApiKey: vi.fn(),
          resetApiKey: vi.fn(),
          isLoading: false,
        }}
      >
        <LanguageContext.Provider value={{ language: 'en', setLanguage: vi.fn(), supportedLanguages: ['en', 'fr'] }}>
          <TemplatePromptDialog
            open={true}
            onOpenChange={mockOnOpenChange}
            template={mockTemplate}
            onUsePrompt={mockOnUsePrompt}
          />
        </LanguageContext.Provider>
      </OpenRouterApiKeyContext.Provider>
    );

    await waitFor(() => {
      expect(mockGenerateTemplatePrompt).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle early return when template becomes null during generation', async () => {
    mockGenerateTemplatePrompt.mockImplementation(() => new Promise(() => {}));
    const { rerender } = renderWithContext(true, mockTemplate, 'test-key');

    await waitFor(() => {
      expect(screen.getByText('generatingTemplatePrompt')).toBeInTheDocument();
    });

    rerender(
      <OpenRouterApiKeyContext.Provider
        value={{
          apiKey: 'test-key',
          setApiKey: vi.fn(),
          resetApiKey: vi.fn(),
          isLoading: false,
        }}
      >
        <LanguageContext.Provider value={{ language: 'en', setLanguage: vi.fn(), supportedLanguages: ['en', 'fr'] }}>
          <TemplatePromptDialog
            open={true}
            onOpenChange={mockOnOpenChange}
            template={null}
            onUsePrompt={mockOnUsePrompt}
          />
        </LanguageContext.Provider>
      </OpenRouterApiKeyContext.Provider>
    );

    expect(screen.queryByText('templatePromptTitle')).not.toBeInTheDocument();
  });
});


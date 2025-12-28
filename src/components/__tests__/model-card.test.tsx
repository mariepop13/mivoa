import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelCard } from '../model-card';
import type { OpenRouterModel } from '@/ai/types/model';

vi.mock('@/ai/services/model-service', () => ({
  formatPrice: vi.fn((prompt: string, completion: string) => `$${prompt} / $${completion} per 1K tokens`),
  formatContextLength: vi.fn((length: number | null) => length ? `${length}K tokens` : 'N/A'),
  extractProvider: vi.fn((id: string) => id.split('/')[0] || 'Unknown'),
}));

describe('ModelCard', () => {
  const mockModel: OpenRouterModel = {
    id: 'openai/gpt-4',
    canonical_slug: 'openai/gpt-4',
    name: 'GPT-4',
    created: 1234567890,
    context_length: 8192,
    pricing: {
      prompt: '0.03',
      completion: '0.06',
      request: '0.00',
      image: '0.00',
    },
    architecture: {
      modality: 'text',
      input_modalities: ['text'],
      output_modalities: ['text'],
      tokenizer: 'gpt-4',
      instruct_type: 'chat',
    },
    top_provider: {
      is_moderated: false,
      context_length: 8192,
      max_completion_tokens: null,
    },
    per_request_limits: null,
    supported_parameters: ['temperature', 'top_p'],
    default_parameters: {
      temperature: 1,
      top_p: 1,
    },
    description: 'GPT-4 model',
  };

  it('should render model information', () => {
    const mockOnSelect = vi.fn();
    render(<ModelCard model={mockModel} isSelected={false} onSelect={mockOnSelect} />);

    expect(screen.getByText('GPT-4')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();
    render(<ModelCard model={mockModel} isSelected={false} onSelect={mockOnSelect} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnSelect).toHaveBeenCalledWith('openai/gpt-4');
  });

  it('should show selected state when isSelected is true', () => {
    const mockOnSelect = vi.fn();
    render(<ModelCard model={mockModel} isSelected={true} onSelect={mockOnSelect} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-primary');
  });

  it('should show unselected state when isSelected is false', () => {
    const mockOnSelect = vi.fn();
    render(<ModelCard model={mockModel} isSelected={false} onSelect={mockOnSelect} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-border');
  });
});


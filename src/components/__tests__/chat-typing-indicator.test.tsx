import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChatTypingIndicator } from '../chat-typing-indicator';

describe('ChatTypingIndicator', () => {
  it('should render the typing indicator', () => {
    const { container } = render(<ChatTypingIndicator />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render three animated dots', () => {
    const { container } = render(<ChatTypingIndicator />);

    const dots = container.querySelectorAll('.animate-pulse');
    expect(dots).toHaveLength(3);
  });

  it('should have correct CSS classes for styling', () => {
    const { container } = render(<ChatTypingIndicator />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('justify-start');
  });
});


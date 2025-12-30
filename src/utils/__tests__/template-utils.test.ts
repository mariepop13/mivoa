import { describe, it, expect, vi } from 'vitest';
import { getTemplateDescription } from '../template-utils';

describe('getTemplateDescription', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      templateGratitudeDescription: 'What are you grateful for today?',
      templateReflectionDescription: 'What happened today? How did you feel? What did you learn?',
      templateDailyDescription: 'How was your day? What did you do in the morning, afternoon, and evening?',
      templateGoalsDescription: 'What are your goals for today? What progress have you made?',
    };
    return translations[key] || key;
  });

  it('should return description for gratitude template', () => {
    const result = getTemplateDescription('gratitude', mockT);
    expect(result).toBe('What are you grateful for today?');
    expect(mockT).toHaveBeenCalledWith('templateGratitudeDescription');
  });

  it('should return description for reflection template', () => {
    const result = getTemplateDescription('reflection', mockT);
    expect(result).toBe('What happened today? How did you feel? What did you learn?');
    expect(mockT).toHaveBeenCalledWith('templateReflectionDescription');
  });

  it('should return description for daily template', () => {
    const result = getTemplateDescription('daily', mockT);
    expect(result).toBe('How was your day? What did you do in the morning, afternoon, and evening?');
    expect(mockT).toHaveBeenCalledWith('templateDailyDescription');
  });

  it('should return description for goals template', () => {
    const result = getTemplateDescription('goals', mockT);
    expect(result).toBe('What are your goals for today? What progress have you made?');
    expect(mockT).toHaveBeenCalledWith('templateGoalsDescription');
  });

  it('should return empty string for unknown template ID', () => {
    vi.clearAllMocks();
    const result = getTemplateDescription('unknown', mockT);
    expect(result).toBe('');
  });

  it('should return empty string for empty template ID', () => {
    const result = getTemplateDescription('', mockT);
    expect(result).toBe('');
  });
});


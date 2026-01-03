import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEntryTemplates } from '../use-entry-templates';
import { useTranslation } from '../use-translation';

vi.mock('../use-translation');

describe('useEntryTemplates', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      templateGratitude: 'Gratitude',
      templateGratitudeTitle: 'Gratitude Journal',
      templateGratitudeContent: 'Today I am grateful for:',
      templateReflection: 'Reflection',
      templateReflectionTitle: 'Daily Reflection',
      templateReflectionContent: 'What happened today?',
      templateDaily: 'Daily Log',
      templateDailyTitle: 'Daily Log',
      templateDailyContent: 'Morning:',
      templateGoals: 'Goals',
      templateGoalsTitle: 'Goals & Progress',
      templateGoalsContent: 'Today\'s goals:',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
  });

  it('should return all 4 templates', () => {
    const { result } = renderHook(() => useEntryTemplates());

    expect(result.current).toHaveLength(4);
    expect(result.current[0].id).toBe('gratitude');
    expect(result.current[1].id).toBe('reflection');
    expect(result.current[2].id).toBe('daily');
    expect(result.current[3].id).toBe('goals');
  });

  it('should return templates with correct structure', () => {
    const { result } = renderHook(() => useEntryTemplates());

    const gratitudeTemplate = result.current[0];
    expect(gratitudeTemplate).toHaveProperty('id');
    expect(gratitudeTemplate).toHaveProperty('name');
    expect(gratitudeTemplate).toHaveProperty('title');
    expect(gratitudeTemplate).toHaveProperty('content');
  });

  it('should use translation function for template names', () => {
    renderHook(() => useEntryTemplates());

    expect(mockT).toHaveBeenCalledWith('templateGratitude');
    expect(mockT).toHaveBeenCalledWith('templateReflection');
    expect(mockT).toHaveBeenCalledWith('templateDaily');
    expect(mockT).toHaveBeenCalledWith('templateGoals');
  });

  it('should use translation function for template titles', () => {
    renderHook(() => useEntryTemplates());

    expect(mockT).toHaveBeenCalledWith('templateGratitudeTitle');
    expect(mockT).toHaveBeenCalledWith('templateReflectionTitle');
    expect(mockT).toHaveBeenCalledWith('templateDailyTitle');
    expect(mockT).toHaveBeenCalledWith('templateGoalsTitle');
  });

  it('should use translation function for template content', () => {
    renderHook(() => useEntryTemplates());

    expect(mockT).toHaveBeenCalledWith('templateGratitudeContent');
    expect(mockT).toHaveBeenCalledWith('templateReflectionContent');
    expect(mockT).toHaveBeenCalledWith('templateDailyContent');
    expect(mockT).toHaveBeenCalledWith('templateGoalsContent');
  });

  it('should return localized templates when language changes', () => {
    const { result, rerender } = renderHook(() => useEntryTemplates());

    const firstResult = result.current[0].name;

    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string) => `FR_${key}`,
      language: 'fr',
      isLoading: false,
      error: null,
    });

    rerender();

    expect(result.current[0].name).not.toBe(firstResult);
    expect(result.current[0].name).toBe('FR_templateGratitude');
  });
});


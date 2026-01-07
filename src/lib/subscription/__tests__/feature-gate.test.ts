import { describe, it, expect } from 'vitest';
import {
  canUseModel,
  canExport,
  canCreateEntry,
  getAnalysisLevel,
  filterAvailableModels,
  getPlanLimits,
  isLimitReached,
  getMaxResolution,
  getFeatureLevel,
} from '../feature-gate';
import { UNLIMITED_ENTRIES } from '../constants';
import type { OpenRouterModel } from '@/ai/types/model';

describe('feature-gate', () => {
  describe('getPlanLimits', () => {
    it('should return limits for free plan', () => {
      const limits = getPlanLimits('free');
      expect(limits.entriesPerMonth).toBe(10);
      expect(limits.modelsAccess).toContain('gpt-3.5-turbo');
      expect(limits.exportEnabled).toBe(false);
    });

    it('should return limits for basic plan', () => {
      const limits = getPlanLimits('basic');
      expect(limits.entriesPerMonth).toBe(100);
      expect(limits.exportEnabled).toBe(true);
    });

    it('should return limits for pro plan', () => {
      const limits = getPlanLimits('pro');
      expect(limits.entriesPerMonth).toBe(UNLIMITED_ENTRIES);
      expect(limits.exportEnabled).toBe(true);
    });
  });

  describe('canUseModel', () => {
    it('should allow free plan to use basic models', () => {
      expect(canUseModel('free', 'gpt-3.5-turbo')).toBe(true);
      expect(canUseModel('free', 'claude-3-haiku')).toBe(true);
    });

    it('should not allow free plan to use advanced models', () => {
      expect(canUseModel('free', 'gpt-4o')).toBe(false);
      expect(canUseModel('free', 'claude-3-opus')).toBe(false);
    });

    it('should allow basic plan to use intermediate models', () => {
      expect(canUseModel('basic', 'claude-3-sonnet')).toBe(true);
      expect(canUseModel('basic', 'gpt-4o-mini')).toBe(true);
    });

    it('should allow pro plan to use all models', () => {
      expect(canUseModel('pro', 'gpt-4o')).toBe(true);
      expect(canUseModel('pro', 'claude-3-opus')).toBe(true);
      expect(canUseModel('pro', 'claude-3.5-sonnet')).toBe(true);
    });
  });

  describe('canExport', () => {
    it('should return false for free plan', () => {
      expect(canExport('free')).toBe(false);
    });

    it('should return true for basic plan', () => {
      expect(canExport('basic')).toBe(true);
    });

    it('should return true for pro plan', () => {
      expect(canExport('pro')).toBe(true);
    });
  });

  describe('canCreateEntry', () => {
    it('should allow creating entry when under limit', () => {
      expect(canCreateEntry('free', 5, 10)).toBe(true);
      expect(canCreateEntry('basic', 50, 100)).toBe(true);
    });

    it('should not allow creating entry when at limit', () => {
      expect(canCreateEntry('free', 10, 10)).toBe(false);
      expect(canCreateEntry('basic', 100, 100)).toBe(false);
    });

    it('should not allow creating entry when over limit', () => {
      expect(canCreateEntry('free', 11, 10)).toBe(false);
      expect(canCreateEntry('basic', 101, 100)).toBe(false);
    });

    it('should always allow for unlimited plans', () => {
      expect(canCreateEntry('pro', 1000, UNLIMITED_ENTRIES)).toBe(true);
      expect(canCreateEntry('pro', 0, UNLIMITED_ENTRIES)).toBe(true);
      expect(canCreateEntry('pro', 999999, UNLIMITED_ENTRIES)).toBe(true);
    });

    it('should handle Infinity limit', () => {
      expect(canCreateEntry('pro', 1000, Infinity)).toBe(true);
      expect(canCreateEntry('pro', 0, Infinity)).toBe(true);
    });
  });

  describe('getAnalysisLevel', () => {
    it('should return basic for free plan', () => {
      expect(getAnalysisLevel('free')).toBe('basic');
    });

    it('should return enhanced for basic plan', () => {
      expect(getAnalysisLevel('basic')).toBe('enhanced');
    });

    it('should return full for pro plan', () => {
      expect(getAnalysisLevel('pro')).toBe('full');
    });
  });

  describe('filterAvailableModels', () => {
    const mockModels: OpenRouterModel[] = [
      {
        id: 'gpt-3.5-turbo',
        canonical_slug: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        created: 0,
        pricing: { prompt: '0', completion: '0', request: '0', image: '0' },
        context_length: null,
        architecture: {
          modality: 'text',
          input_modalities: [],
          output_modalities: [],
          tokenizer: '',
          instruct_type: '',
        },
        top_provider: { is_moderated: false, context_length: null, max_completion_tokens: null },
        per_request_limits: null,
        supported_parameters: [],
        default_parameters: null,
        description: '',
      },
      {
        id: 'gpt-4o',
        canonical_slug: 'gpt-4o',
        name: 'GPT-4o',
        created: 0,
        pricing: { prompt: '0', completion: '0', request: '0', image: '0' },
        context_length: null,
        architecture: {
          modality: 'text',
          input_modalities: [],
          output_modalities: [],
          tokenizer: '',
          instruct_type: '',
        },
        top_provider: { is_moderated: false, context_length: null, max_completion_tokens: null },
        per_request_limits: null,
        supported_parameters: [],
        default_parameters: null,
        description: '',
      },
      {
        id: 'claude-3-haiku',
        canonical_slug: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        created: 0,
        pricing: { prompt: '0', completion: '0', request: '0', image: '0' },
        context_length: null,
        architecture: {
          modality: 'text',
          input_modalities: [],
          output_modalities: [],
          tokenizer: '',
          instruct_type: '',
        },
        top_provider: { is_moderated: false, context_length: null, max_completion_tokens: null },
        per_request_limits: null,
        supported_parameters: [],
        default_parameters: null,
        description: '',
      },
    ];

    it('should filter models for free plan', () => {
      const filtered = filterAvailableModels('free', mockModels);
      expect(filtered).toHaveLength(2);
      expect(filtered.map((m) => m.id)).toContain('gpt-3.5-turbo');
      expect(filtered.map((m) => m.id)).toContain('claude-3-haiku');
      expect(filtered.map((m) => m.id)).not.toContain('gpt-4o');
    });

    it('should filter models for basic plan', () => {
      const filtered = filterAvailableModels('basic', mockModels);
      expect(filtered.length).toBeGreaterThanOrEqual(2);
      expect(filtered.map((m) => m.id)).toContain('gpt-3.5-turbo');
      expect(filtered.map((m) => m.id)).toContain('claude-3-haiku');
    });

    it('should include all available models for pro plan', () => {
      const filtered = filterAvailableModels('pro', mockModels);
      expect(filtered.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no models match', () => {
      const emptyModels: OpenRouterModel[] = [];
      expect(filterAvailableModels('free', emptyModels)).toEqual([]);
    });
  });

  describe('isLimitReached', () => {
    it('should return false when usage is below limit', () => {
      expect(isLimitReached(5, 10)).toBe(false);
      expect(isLimitReached(0, 10)).toBe(false);
      expect(isLimitReached(9, 10)).toBe(false);
    });

    it('should return true when usage equals limit', () => {
      expect(isLimitReached(10, 10)).toBe(true);
      expect(isLimitReached(100, 100)).toBe(true);
    });

    it('should return true when usage exceeds limit', () => {
      expect(isLimitReached(11, 10)).toBe(true);
      expect(isLimitReached(101, 100)).toBe(true);
    });
  });

  describe('getMaxResolution', () => {
    it('should return standard for free plan', () => {
      expect(getMaxResolution('free')).toBe('standard');
    });

    it('should return standard for basic plan', () => {
      expect(getMaxResolution('basic')).toBe('standard');
    });

    it('should return high for pro plan', () => {
      expect(getMaxResolution('pro')).toBe('high');
    });
  });

  describe('getFeatureLevel', () => {
    it('should return basic for free plan', () => {
      expect(getFeatureLevel('free')).toBe('basic');
    });

    it('should return intermediate for basic plan', () => {
      expect(getFeatureLevel('basic')).toBe('intermediate');
    });

    it('should return advanced for pro plan', () => {
      expect(getFeatureLevel('pro')).toBe('advanced');
    });
  });
});


import { describe, it, expect } from 'vitest';
import {
  canUseAdvancedAnalysis,
  canUseMultiEntryAnalysis,
  canUsePeriodSummary,
  canExportPDF,
  canExportBackup,
  canUseCustomTemplates,
  canUseSemanticSearch,
  getAnalysisLevel,
  getPlanLimits,
  getFeatureLevel,
  hasSupporterBadge,
  getSupporterAccentColors,
  getSupporterCosmetics,
} from '../feature-gate';

describe('feature-gate', () => {
  describe('getPlanLimits', () => {
    it('should return limits for free plan', () => {
      const limits = getPlanLimits('free');
      expect(limits.advancedAnalysis).toBe(false);
      expect(limits.multiEntryAnalysis).toBe(false);
      expect(limits.exportPDF).toBe(false);
      expect(limits.customTemplates).toBe(false);
    });

    it('should return limits for supporter plan', () => {
      const limits = getPlanLimits('supporter');
      expect(limits.advancedAnalysis).toBe(false);
      expect(limits.multiEntryAnalysis).toBe(false);
      expect(limits.exportPDF).toBe(false);
      expect(limits.customTemplates).toBe(false);
    });

    it('should return limits for pro plan', () => {
      const limits = getPlanLimits('pro');
      expect(limits.advancedAnalysis).toBe(true);
      expect(limits.multiEntryAnalysis).toBe(true);
      expect(limits.exportPDF).toBe(true);
      expect(limits.customTemplates).toBe(true);
    });
  });

  describe('canUseAdvancedAnalysis', () => {
    it('should return false for free plan', () => {
      expect(canUseAdvancedAnalysis('free')).toBe(false);
    });

    it('should return false for supporter plan', () => {
      expect(canUseAdvancedAnalysis('supporter')).toBe(false);
    });

    it('should return true for pro plan', () => {
      expect(canUseAdvancedAnalysis('pro')).toBe(true);
    });
  });

  describe('canUseMultiEntryAnalysis', () => {
    it('should return false for free plan', () => {
      expect(canUseMultiEntryAnalysis('free')).toBe(false);
    });

    it('should return false for supporter plan', () => {
      expect(canUseMultiEntryAnalysis('supporter')).toBe(false);
    });

    it('should return true for pro plan', () => {
      expect(canUseMultiEntryAnalysis('pro')).toBe(true);
    });
  });

  describe('canUsePeriodSummary', () => {
    it('should return false for free plan', () => {
      expect(canUsePeriodSummary('free')).toBe(false);
    });

    it('should return false for supporter plan', () => {
      expect(canUsePeriodSummary('supporter')).toBe(false);
    });

    it('should return true for pro plan', () => {
      expect(canUsePeriodSummary('pro')).toBe(true);
    });
  });

  describe('canExportPDF', () => {
    it('should return false for free plan', () => {
      expect(canExportPDF('free')).toBe(false);
    });

    it('should return false for supporter plan', () => {
      expect(canExportPDF('supporter')).toBe(false);
    });

    it('should return true for pro plan', () => {
      expect(canExportPDF('pro')).toBe(true);
    });
  });

  describe('canExportBackup', () => {
    it('should return false for free plan', () => {
      expect(canExportBackup('free')).toBe(false);
    });

    it('should return false for supporter plan', () => {
      expect(canExportBackup('supporter')).toBe(false);
    });

    it('should return true for pro plan', () => {
      expect(canExportBackup('pro')).toBe(true);
    });
  });

  describe('canUseCustomTemplates', () => {
    it('should return false for free plan', () => {
      expect(canUseCustomTemplates('free')).toBe(false);
    });

    it('should return false for supporter plan', () => {
      expect(canUseCustomTemplates('supporter')).toBe(false);
    });

    it('should return true for pro plan', () => {
      expect(canUseCustomTemplates('pro')).toBe(true);
    });
  });

  describe('canUseSemanticSearch', () => {
    it('should return false for free plan', () => {
      expect(canUseSemanticSearch('free')).toBe(false);
    });

    it('should return false for supporter plan', () => {
      expect(canUseSemanticSearch('supporter')).toBe(false);
    });

    it('should return true for pro plan', () => {
      expect(canUseSemanticSearch('pro')).toBe(true);
    });
  });

  describe('getAnalysisLevel', () => {
    it('should return basic for free plan', () => {
      expect(getAnalysisLevel('free')).toBe('basic');
    });

    it('should return basic for supporter plan', () => {
      expect(getAnalysisLevel('supporter')).toBe('basic');
    });

    it('should return full for pro plan', () => {
      expect(getAnalysisLevel('pro')).toBe('full');
    });
  });

  describe('getFeatureLevel', () => {
    it('should return basic for free plan', () => {
      expect(getFeatureLevel('free')).toBe('basic');
    });

    it('should return basic for supporter plan', () => {
      expect(getFeatureLevel('supporter')).toBe('basic');
    });

    it('should return advanced for pro plan', () => {
      expect(getFeatureLevel('pro')).toBe('advanced');
    });
  });

  describe('supporter cosmetics', () => {
    it('should return false for free plan badge', () => {
      expect(hasSupporterBadge('free')).toBe(false);
    });

    it('should return true for supporter plan badge', () => {
      expect(hasSupporterBadge('supporter')).toBe(true);
    });

    it('should return true for pro plan badge', () => {
      expect(hasSupporterBadge('pro')).toBe(true);
    });

    it('should return empty array for free plan accent colors', () => {
      expect(getSupporterAccentColors('free')).toEqual([]);
    });

    it('should return accent colors for supporter plan', () => {
      const colors = getSupporterAccentColors('supporter');
      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0]).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should return accent colors for pro plan', () => {
      const colors = getSupporterAccentColors('pro');
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should return cosmetics for free plan', () => {
      const cosmetics = getSupporterCosmetics('free');
      expect(cosmetics.badge).toBe(false);
      expect(cosmetics.accentColors).toEqual([]);
    });

    it('should return cosmetics for supporter plan', () => {
      const cosmetics = getSupporterCosmetics('supporter');
      expect(cosmetics.badge).toBe(true);
      expect(cosmetics.accentColors.length).toBeGreaterThan(0);
    });

    it('should return cosmetics for pro plan', () => {
      const cosmetics = getSupporterCosmetics('pro');
      expect(cosmetics.badge).toBe(true);
      expect(cosmetics.accentColors.length).toBeGreaterThan(0);
    });
  });
});

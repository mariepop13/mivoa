import { describe, it, expect } from 'vitest';
import { getMoodConfig } from '../mood-utils';

describe('mood-utils', () => {
  describe('getMoodConfig', () => {
    it('should return default config for undefined mood', () => {
      const config = getMoodConfig(undefined);
      expect(config.emoji).toBe('☕');
      expect(config.label.en).toBe('Unknown');
      expect(config.label.fr).toBe('Inconnu');
    });

    it('should return default config for empty string', () => {
      const config = getMoodConfig('');
      expect(config.emoji).toBe('☕');
    });

    it('should return config for happy mood (English)', () => {
      const config = getMoodConfig('happy');
      expect(config.emoji).toBe('😊');
      expect(config.label.en).toBe('Happy');
      expect(config.label.fr).toBe('Heureux');
    });

    it('should return config for happy mood (French)', () => {
      const config = getMoodConfig('heureux');
      expect(config.emoji).toBe('😊');
      expect(config.label.en).toBe('Happy');
      expect(config.label.fr).toBe('Heureux');
    });

    it('should return config for grateful mood', () => {
      const config = getMoodConfig('grateful');
      expect(config.emoji).toBe('❤️');
      expect(config.label.en).toBe('Grateful');
    });

    it('should return config for anxious mood', () => {
      const config = getMoodConfig('anxious');
      expect(config.emoji).toBe('😰');
      expect(config.label.en).toBe('Anxious');
    });

    it('should return config for sad mood', () => {
      const config = getMoodConfig('sad');
      expect(config.emoji).toBe('😢');
      expect(config.label.en).toBe('Sad');
    });

    it('should return config for stressed mood', () => {
      const config = getMoodConfig('stressed');
      expect(config.emoji).toBe('😓');
      expect(config.label.en).toBe('Stressed');
    });

    it('should return config for worried mood', () => {
      const config = getMoodConfig('worried');
      expect(config.emoji).toBe('😟');
      expect(config.label.en).toBe('Worried');
    });

    it('should return config for neutral mood', () => {
      const config = getMoodConfig('neutral');
      expect(config.emoji).toBe('😐');
      expect(config.label.en).toBe('Neutral');
    });

    it('should return config for calm mood', () => {
      const config = getMoodConfig('calm');
      expect(config.emoji).toBe('🌙');
      expect(config.label.en).toBe('Calm');
    });

    it('should return config for serene mood', () => {
      const config = getMoodConfig('serene');
      expect(config.emoji).toBe('☁️');
      expect(config.label.en).toBe('Serene');
    });

    it('should handle case insensitive mood names', () => {
      const config1 = getMoodConfig('HAPPY');
      const config2 = getMoodConfig('Happy');
      const config3 = getMoodConfig('happy');
      
      expect(config1.emoji).toBe('😊');
      expect(config2.emoji).toBe('😊');
      expect(config3.emoji).toBe('😊');
    });

    it('should handle mood names with whitespace', () => {
      const config = getMoodConfig('  happy  ');
      expect(config.emoji).toBe('😊');
    });

    it('should return default config for unknown mood', () => {
      const config = getMoodConfig('unknown-mood');
      expect(config.emoji).toBe('☕');
      expect(config.label.en).toBe('Unknown');
    });

    it('should return config with French labels when language is fr', () => {
      const config = getMoodConfig('happy', 'fr');
      expect(config.emoji).toBe('😊');
      expect(config.label.en).toBe('Happy');
      expect(config.label.fr).toBe('Heureux');
    });

    it('should return config with English labels when language is en', () => {
      const config = getMoodConfig('heureux', 'en');
      expect(config.emoji).toBe('😊');
      expect(config.label.en).toBe('Happy');
      expect(config.label.fr).toBe('Heureux');
    });
  });
});

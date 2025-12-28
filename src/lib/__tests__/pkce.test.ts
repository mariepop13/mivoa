import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generatePKCEPair,
} from '../pkce';

describe('pkce', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCodeVerifier', () => {
    it('should generate a base64url encoded string', () => {
      const verifier = generateCodeVerifier();

      expect(verifier).toBeTruthy();
      expect(typeof verifier).toBe('string');
      expect(verifier.length).toBeGreaterThan(0);
    });

    it('should not contain +, /, or = characters', () => {
      const verifier = generateCodeVerifier();

      expect(verifier).not.toContain('+');
      expect(verifier).not.toContain('/');
      expect(verifier).not.toContain('=');
    });

    it('should generate different verifiers on each call', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();

      expect(verifier1).not.toBe(verifier2);
    });

    it('should generate verifier of appropriate length', () => {
      const verifier = generateCodeVerifier();

      expect(verifier.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a challenge from a verifier', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      expect(challenge).toBeTruthy();
      expect(typeof challenge).toBe('string');
      expect(challenge.length).toBeGreaterThan(0);
    });

    it('should generate base64url encoded challenge', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      expect(challenge).not.toContain('+');
      expect(challenge).not.toContain('/');
      expect(challenge).not.toContain('=');
    });

    it('should generate the same challenge for the same verifier', async () => {
      const verifier = generateCodeVerifier();
      const challenge1 = await generateCodeChallenge(verifier);
      const challenge2 = await generateCodeChallenge(verifier);

      expect(challenge1).toBe(challenge2);
    });

    it('should generate different challenges for different verifiers', async () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      const challenge1 = await generateCodeChallenge(verifier1);
      const challenge2 = await generateCodeChallenge(verifier2);

      expect(challenge1).not.toBe(challenge2);
    });
  });

  describe('generatePKCEPair', () => {
    it('should generate a complete PKCE pair', async () => {
      const pair = await generatePKCEPair();

      expect(pair).toHaveProperty('codeVerifier');
      expect(pair).toHaveProperty('codeChallenge');
      expect(pair).toHaveProperty('codeChallengeMethod');
    });

    it('should set codeChallengeMethod to S256', async () => {
      const pair = await generatePKCEPair();

      expect(pair.codeChallengeMethod).toBe('S256');
    });

    it('should generate valid verifier and challenge', async () => {
      const pair = await generatePKCEPair();

      expect(pair.codeVerifier).toBeTruthy();
      expect(pair.codeChallenge).toBeTruthy();
      expect(typeof pair.codeVerifier).toBe('string');
      expect(typeof pair.codeChallenge).toBe('string');
    });

    it('should generate challenge that matches verifier', async () => {
      const pair = await generatePKCEPair();
      const expectedChallenge = await generateCodeChallenge(pair.codeVerifier);

      expect(pair.codeChallenge).toBe(expectedChallenge);
    });

    it('should generate different pairs on each call', async () => {
      const pair1 = await generatePKCEPair();
      const pair2 = await generatePKCEPair();

      expect(pair1.codeVerifier).not.toBe(pair2.codeVerifier);
      expect(pair1.codeChallenge).not.toBe(pair2.codeChallenge);
    });
  });
});


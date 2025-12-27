import { generatePKCEPair, type PKCEPair } from './pkce';

const OPENROUTER_AUTH_BASE_URL = 'https://openrouter.ai';
const STORAGE_KEY_PKCE = 'openrouter_oauth_pkce';
const STORAGE_KEY_STATE = 'openrouter_oauth_state';

export interface ExchangeResponse {
  key: string;
  user_id: string | null;
}

export async function initiateOAuthFlow(callbackUrl: string): Promise<void> {
  if (typeof callbackUrl !== 'string' || callbackUrl.trim() === '') {
    throw new TypeError('callbackUrl must be a non-empty string');
  }

  try {
    new URL(callbackUrl);
  } catch {
    throw new TypeError(`Invalid callback URL: ${callbackUrl}`);
  }

  if (!callbackUrl.startsWith('https://')) {
    throw new TypeError('callbackUrl must be an HTTPS URL');
  }

  const pkce = await generatePKCEPair();
  const state = generateRandomState();

  try {
    sessionStorage.setItem(STORAGE_KEY_PKCE, JSON.stringify(pkce));
    sessionStorage.setItem(STORAGE_KEY_STATE, state);

    const params = new URLSearchParams({
      callback_url: callbackUrl,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod,
      state: state,
    });

    const authUrl = `${OPENROUTER_AUTH_BASE_URL}/auth?${params.toString()}`;
    window.location.href = authUrl;
  } catch (error) {
    console.error('Failed to initiate OAuth flow:', {
      error,
      callbackUrl,
      state,
      hasPkce: !!pkce,
    });
    throw error;
  }
}

export async function exchangeAuthCodeForApiKey(
  code: string,
  state?: string
): Promise<string> {
  if (typeof code !== 'string' || code.trim() === '') {
    throw new TypeError('code must be a non-empty string');
  }

  const storedState = sessionStorage.getItem(STORAGE_KEY_STATE);
  const storedPKCE = sessionStorage.getItem(STORAGE_KEY_PKCE);

  if (state && storedState !== state) {
    throw new Error('Invalid state parameter');
  }

  if (!storedPKCE) {
    throw new Error('PKCE data not found. Please restart the OAuth flow.');
  }

  let pkce: PKCEPair;
  try {
    pkce = JSON.parse(storedPKCE);
  } catch {
    throw new Error('Failed to parse stored PKCE data. Please restart the OAuth flow.');
  }

  try {
    const response = await fetch(`${OPENROUTER_AUTH_BASE_URL}/api/v1/auth/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: pkce.codeVerifier,
        code_challenge_method: pkce.codeChallengeMethod,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange auth code: ${response.status} ${errorText}`);
    }

    const data: ExchangeResponse = await response.json();
    
    sessionStorage.removeItem(STORAGE_KEY_PKCE);
    sessionStorage.removeItem(STORAGE_KEY_STATE);
    
    return data.key;
  } catch (error) {
    console.error('Failed to exchange auth code:', {
      error,
      code: code.substring(0, 10) + '...',
      hasState: !!state,
    });
    throw error;
  }
}

function generateRandomState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}


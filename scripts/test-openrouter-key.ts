#!/usr/bin/env tsx

import { validateOpenRouterApiKey } from '../src/lib/openrouter-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const apiKey = process.env.TEST_OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('❌ TEST_OPENROUTER_API_KEY not found in .env.local');
    console.log('\nTo test with a real key:');
    console.log('1. Create or edit .env.local');
    console.log('2. Add: TEST_OPENROUTER_API_KEY=your-openrouter-api-key');
    console.log('3. Run this script again');
    process.exit(1);
  }

  console.log('🔑 Testing OpenRouter API key validation...');
  console.log(`Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('');

  try {
    const isValid = await validateOpenRouterApiKey(apiKey, '', true);
    
    if (isValid) {
      console.log('✅ API key is VALID');
      process.exit(0);
    } else {
      console.log('❌ API key is INVALID');
      console.log('Please check your API key at https://openrouter.ai/keys');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error validating API key:', error);
    process.exit(1);
  }
}

main();


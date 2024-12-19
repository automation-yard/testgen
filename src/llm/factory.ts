import { LLMClient } from './client';
import { TestGenConfig } from '../config/schema';

export type LLMProvider = 'anthropic' | 'openai' | 'qwen' | 'google';

export function createLLMClient(
  apiKey: string,
  config: TestGenConfig
): LLMClient {
  return new LLMClient(apiKey, config);
}

import { AnthropicClient } from './anthropic';
import { OpenAIClient } from './openai';
import { QwenClient } from './qwen';
import { LLMClient } from './types';
import { TestGenConfig } from '../config/schema';

export type LLMProvider = 'anthropic' | 'openai' | 'qwen';

export function createLLMClient(
  provider: LLMProvider,
  apiKey: string,
  config: TestGenConfig
): LLMClient {
  switch (provider) {
    case 'anthropic':
      return new AnthropicClient(apiKey, config);
    case 'openai':
      return new OpenAIClient(apiKey, config);
    case 'qwen':
      return new QwenClient(apiKey, config);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

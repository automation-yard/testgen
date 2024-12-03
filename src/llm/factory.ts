import { AnthropicClient } from './anthropic';
import { OpenAIClient } from './openai';
import { QwenClient } from './qwen';
import { LLMClient } from './types';

export type LLMProvider = 'anthropic' | 'openai' | 'qwen';

export function createLLMClient(
  provider: LLMProvider,
  apiKey: string
): LLMClient {
  switch (provider) {
    case 'anthropic':
      return new AnthropicClient(apiKey);
    case 'openai':
      return new OpenAIClient(apiKey);
    case 'qwen':
      return new QwenClient(apiKey);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

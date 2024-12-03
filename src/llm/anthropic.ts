import AI from '@anthropic-ai/sdk';
import { LLMClient, LLMCompleteParams, LLMResponse } from './types';

export class AnthropicClient implements LLMClient {
  private client: AI;

  constructor(apiKey: string) {
    this.client = new AI({ apiKey });
  }

  public async generateText(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }]
    });

    if (
      !response ||
      !response.content ||
      !response.content[0] ||
      !('text' in response.content[0])
    ) {
      throw new Error('Invalid response from API');
    }

    return response.content[0].text.trim();
  }

  public async complete(params: LLMCompleteParams): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: params.model || 'claude-3-5-sonnet-20241022',
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0,
      messages: [{ role: 'user', content: params.prompt }]
    });

    if (
      !response ||
      !response.content ||
      !response.content[0] ||
      !('text' in response.content[0])
    ) {
      throw new Error('Invalid response from API');
    }

    return {
      content: response.content[0].text.trim(),
      model: response.model,
      usage: {
        promptTokens: response.usage?.input_tokens ?? 0,
        completionTokens: response.usage?.output_tokens ?? 0,
        totalTokens:
          (response.usage?.input_tokens ?? 0) +
          (response.usage?.output_tokens ?? 0)
      }
    };
  }
}

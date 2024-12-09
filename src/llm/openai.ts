import OpenAI from 'openai';
import { LLMClient, LLMCompleteParams, LLMResponse } from './types';
import { TestGenConfig } from '../config/schema';

export class OpenAIClient implements LLMClient {
  private client: OpenAI;
  private config: TestGenConfig;

  constructor(apiKey: string, config: TestGenConfig) {
    this.client = new OpenAI({ apiKey });
    this.config = config;
  }

  public async generateText(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: this.config.llm.maxTokens,
      n: 1,
      stop: null
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error('Invalid response from API');
    }

    return response.choices[0].message.content.trim();
  }

  public async complete(params: LLMCompleteParams): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: params.model || 'gpt-4-1106-preview',
      messages: [{ role: 'user', content: params.prompt }],
      temperature: params.temperature ?? 0,
      max_tokens: params.maxTokens ?? this.config.llm.maxTokens,
      n: 1,
      stop: null
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error('Invalid response from API');
    }

    return {
      content: response.choices[0].message.content.trim(),
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0
      }
    };
  }
}

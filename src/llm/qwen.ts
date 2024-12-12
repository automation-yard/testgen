import { HfInference } from '@huggingface/inference';
import { LLMClient, LLMCompleteParams, LLMResponse } from './types';
import { writeDebugFile } from '../utils/files';
import { TestGenConfig } from '../config/schema';

export class QwenClient implements LLMClient {
  private client: HfInference;
  private config: TestGenConfig;

  constructor(apiKey: string, config: TestGenConfig) {
    this.client = new HfInference(apiKey);
    this.config = config;
  }

  public async generateText(prompt: string): Promise<string> {
    try {
      const response = await this.client.chatCompletion({
        model: 'Qwen/QwQ-32B-Preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: this.config.llm.maxTokens,
        stream: false
      });

      if (!response.choices[0]?.message?.content) {
        throw new Error('Invalid response from API');
      }
      writeDebugFile('qwen.json', JSON.stringify(response, null, 2));

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating text with Qwen: ', error);
      throw error;
    }
  }

  public async complete(params: LLMCompleteParams): Promise<LLMResponse> {
    const response = await this.client.chatCompletion({
      model: params.model || 'Qwen/QwQ-32B-Preview',
      messages: [{ role: 'user', content: params.prompt }],
      temperature: params?.temperature ?? 0.2,
      max_tokens: params?.maxTokens ?? this.config.llm.maxTokens,
      stream: false
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error('Invalid response from API');
    }

    // HuggingFace doesn't provide token usage info, so we'll estimate
    const promptTokens = Math.ceil(params.prompt.length / 4);
    const completionTokens = Math.ceil(
      response.choices[0].message.content.length / 4
    );

    return {
      content: response.choices[0].message.content.trim(),
      model: params.model || 'Qwen/QwQ-32B-Preview',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      }
    };
  }
}

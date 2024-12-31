import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { HfInference } from '@huggingface/inference';
import { LLMResponse } from './types';
import { TestGenConfig } from '../config/schema';
import { writeDebugFile } from '../utils/files';
import { generateText as aiGenerateText } from 'ai';

export class LLMClient {
  private openaiClient?: ReturnType<typeof createOpenAI>;
  private anthropicClient?: ReturnType<typeof createAnthropic>;
  private googleClient?: ReturnType<typeof createGoogleGenerativeAI>;
  private huggingfaceClient?: HfInference;

  constructor(
    private readonly apiKey: string,
    private readonly config: TestGenConfig
  ) {
    this.initializeClient();
  }

  private initializeClient() {
    switch (this.config.llm.provider) {
      case 'openai':
        this.openaiClient = createOpenAI({ apiKey: this.apiKey });
        break;
      case 'anthropic':
        this.anthropicClient = createAnthropic({ apiKey: this.apiKey });
        break;
      case 'google':
        this.googleClient = createGoogleGenerativeAI({ apiKey: this.apiKey });
        break;
      case 'qwen':
        this.huggingfaceClient = new HfInference(this.apiKey);
        break;
      default:
        throw new Error(
          `Unsupported LLM provider: ${this.config.llm.provider}`
        );
    }
  }

  public async generateText(prompt: string): Promise<LLMResponse> {
    try {
      const model = this.getModel(
        this.config.llm.provider,
        this.config.llm.model
      );

      const { text, usage } = await aiGenerateText({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.llm.temperature,
        maxTokens: this.config.llm.maxTokens
      });

      return {
        content: text.trim(),
        model,
        usage
      };
    } catch (error) {
      console.error(
        `Error generating text with ${this.config.llm.provider}:`,
        error
      );
      throw error;
    }
  }

  private getModel(provider: string, model?: string): any {
    const defaultModel = this.getDefaultModel();
    const selectedModel = model || defaultModel;

    switch (provider) {
      case 'openai':
        if (!this.openaiClient)
          throw new Error('OpenAI client not initialized');
        return this.openaiClient(selectedModel);
      case 'anthropic':
        if (!this.anthropicClient)
          throw new Error('Anthropic client not initialized');
        return this.anthropicClient(selectedModel);
      case 'google':
        if (!this.googleClient)
          throw new Error('Google client not initialized');
        return this.googleClient(selectedModel);
      case 'qwen':
        if (!this.huggingfaceClient)
          throw new Error('Hugging Face client not initialized');
        return selectedModel;
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  private getDefaultModel(): string {
    switch (this.config.llm.provider) {
      case 'openai':
        return 'gpt-4-turbo';
      case 'anthropic':
        return 'claude-3-sonnet-20240229';
      case 'google':
        return 'gemini-pro';
      case 'qwen':
        return 'Qwen/QwQ-32B-Preview';
      default:
        throw new Error(
          `Unsupported LLM provider: ${this.config.llm.provider}`
        );
    }
  }
}

import { Message } from 'ai';

export interface LLMClient {
  generateText(prompt: string): Promise<LLMResponse>;
}

export interface LLMResponse {
  content: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMMessage extends Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface LLMClient {
  generateText(prompt: string): Promise<string>;
  complete(params: LLMCompleteParams): Promise<LLMResponse>;
}

export interface LLMCompleteParams {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
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

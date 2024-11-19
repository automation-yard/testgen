import OpenAI from "openai";
import { LLMClient } from "./llm-client";

export class OpenAIClient implements LLMClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  public async generateText(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0,
      n: 1,
      stop: null,
    });
    return response.choices[0].message.content || "";
  }
}

import OpenAI from "openai";
import { LLMClient } from "./types";

export class OpenAIClient implements LLMClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  public async generateText(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 4096,
      n: 1,
      stop: null,
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error("Invalid response from API");
    }

    return response.choices[0].message.content.trim();
  }
}

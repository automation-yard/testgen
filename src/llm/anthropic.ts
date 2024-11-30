import AI from "@anthropic-ai/sdk";
import { LLMClient } from "./types";

export class AnthropicClient implements LLMClient {
  private client: AI;

  constructor(apiKey: string) {
    this.client = new AI({ apiKey });
  }

  public async generateText(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    if (
      !response ||
      !response.content ||
      !response.content[0] ||
      !("text" in response.content[0])
    ) {
      throw new Error("Invalid response from API");
    }

    return response.content[0].text.trim();
  }
}

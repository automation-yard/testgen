import { z } from "zod";

const frameworkEnum = z.enum([
  "nestjs",
  "express",
  "fastify",
  "react",
  "nextjs",
]);

const languageEnum = z.enum(["javascript", "typescript"]);

const llmProviderEnum = z.enum(["anthropic", "openai"]);

export const configSchema = z.object({
  // Project Configuration
  language: languageEnum.default("typescript"),
  framework: frameworkEnum,

  // Test Configuration
  testFilePattern: z
    .string()
    .default("${filename}.test.${ext}")
    .describe(
      "Pattern for generated test files. Variables: ${filename}, ${ext}"
    ),

  // LLM Configuration
  llm: z.object({
    provider: llmProviderEnum.default("anthropic"),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).default(0),
    maxTokens: z.number().positive().default(4096),
  }),

  // Custom Prompts (optional)
  prompts: z
    .object({
      pre: z.string().optional(),
      post: z.string().optional(),
    })
    .optional(),

  // Test Coverage Thresholds (optional)
  coverage: z
    .object({
      statements: z.number().min(0).max(100).optional(),
      branches: z.number().min(0).max(100).optional(),
      functions: z.number().min(0).max(100).optional(),
      lines: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

export type TestGenConfig = z.infer<typeof configSchema>;

// Default configuration
export const defaultConfig: TestGenConfig = {
  language: "typescript",
  framework: "react",
  testFilePattern: "${filename}.test.${ext}",
  llm: {
    provider: "anthropic",
    temperature: 0,
    maxTokens: 4096,
  },
};

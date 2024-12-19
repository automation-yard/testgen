import { z } from 'zod';

const frameworkEnum = z.enum([
  'nestjs',
  'express',
  'fastify',
  'react',
  'nextjs'
]);

const languageEnum = z.enum(['javascript', 'typescript']);

const llmProviderEnum = z.enum(['anthropic', 'openai', 'qwen', 'google']);

const healingStrategyEnum = z.enum(['aggressive', 'conservative']);

export const configSchema = z.object({
  // Project Configuration
  language: languageEnum.default('typescript'),
  framework: frameworkEnum,

  // Test Configuration
  testFilePattern: z
    .string()
    .default('${filename}.spec.${ext}')
    .describe(
      'Pattern for generated test files. Variables: ${filename}, ${ext}'
    ),

  // LLM Configuration
  llm: z.object({
    provider: llmProviderEnum.default('anthropic'),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().positive().optional(),
    apiKey: z.string().optional()
  }),

  // Custom Prompts (optional)
  prompts: z
    .object({
      pre: z.string().optional(),
      post: z.string().optional()
    })
    .optional(),

  // Test Coverage Configuration
  coverage: z
    .object({
      minimum: z.object({
        statements: z.number().min(0).max(100).default(80),
        branches: z.number().min(0).max(100).default(80),
        functions: z.number().min(0).max(100).default(80),
        lines: z.number().min(0).max(100).default(80)
      }),
      maxEnhancementAttempts: z.number().positive().default(3)
    })
    .optional(),

  // Test Healing Configuration
  healing: z
    .object({
      strategy: healingStrategyEnum.default('conservative'),
      maxRetriesForFix: z.number().positive().default(3),
      timeoutPerAttempt: z.number().positive().optional()
    })
    .optional()
});

export type TestGenConfig = z.infer<typeof configSchema>;

// Default configuration
export const defaultConfig: TestGenConfig = {
  language: 'typescript',
  framework: 'express',
  testFilePattern: '${filename}.test.${ext}',
  llm: {
    provider: 'anthropic',
    temperature: 0,
    maxTokens: undefined, // 8192 is the max tokens for anthropic
    apiKey: ''
  },
  coverage: {
    minimum: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    },
    maxEnhancementAttempts: 3
  },
  healing: {
    strategy: 'conservative',
    maxRetriesForFix: 3
  }
};

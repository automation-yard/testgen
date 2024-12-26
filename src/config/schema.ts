import { z } from 'zod';

export const configSchema = z
  .object({
    language: z.enum(['javascript', 'typescript']),
    framework: z.enum([
      'nodejs',
      'nestjs',
      'express',
      'fastify',
      'react',
      'nextjs'
    ]),
    testFilePattern: z.string(),
    isMonoRepo: z.boolean().default(false),
    currentRoot: z.string().optional(),
    llm: z.object({
      provider: z.enum(['anthropic', 'openai', 'google', 'qwen']),
      model: z.string().optional(),
      temperature: z.number().min(0).max(2),
      maxTokens: z.number().positive().optional(),
      apiKey: z.string().optional()
    }),
    coverage: z
      .object({
        minimum: z.object({
          statements: z.number().min(0).max(100),
          branches: z.number().min(0).max(100),
          functions: z.number().min(0).max(100),
          lines: z.number().min(0).max(100)
        }),
        maxEnhancementAttempts: z.number().positive()
      })
      .optional(),
    healing: z
      .object({
        strategy: z.enum(['conservative', 'aggressive']),
        maxRetriesForFix: z.number().positive(),
        timeoutPerAttempt: z.number().positive().optional()
      })
      .optional()
  })
  .refine(
    (data) => {
      // Ensure currentRoot is provided when isMonoRepo is true
      if (data.isMonoRepo && !data.currentRoot) {
        return false;
      }
      return true;
    },
    {
      message: 'currentRoot is required when isMonoRepo is true',
      path: ['currentRoot']
    }
  );

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
    maxRetriesForFix: 3,
    timeoutPerAttempt: 10000
  },
  isMonoRepo: false,
  currentRoot: undefined
};

export type TestGenConfig = z.infer<typeof configSchema>;

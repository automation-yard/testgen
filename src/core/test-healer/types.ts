import { TestError } from '../test-runner/types';

export interface TestHealingInput {
  originalServiceFile: string;
  generatedTestFile: string;
  testRunError: TestError[];
  attemptNumber: number;
  maxRetries: number;
}

export interface TestHealingResult {
  isFixed: boolean;
  fixedTestFile?: string;
  remainingErrors?: TestError[];
  healingAttempts: HealingAttempt[];
}

export interface HealingAttempt {
  attemptNumber: number;
  error: TestError;
  fix: string;
  success: boolean;
}

export interface HealingPromptParams {
  originalServiceCode: string;
  testCode: string;
  error: TestError;
  previousAttempts: HealingAttempt[];
}

export interface HealingConfig {
  maxRetries: number;
  timeoutPerAttempt: number | undefined;
  healingStrategy: 'aggressive' | 'conservative';
}

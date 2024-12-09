import fs from 'fs/promises';
import {
  TestHealingInput,
  TestHealingResult,
  HealingConfig,
  HealingAttempt
} from './types';
import { buildHealingPrompt } from './prompt';
import { testRunner } from '../test-runner';
import { LLMClient } from '../../llm/types';
import { writeDebugFile } from '../../utils/files';
import { TestGenConfig } from '../../config/schema';

export class TestHealer {
  constructor(
    private readonly config: HealingConfig,
    private readonly llm: LLMClient,
    private readonly testGenConfig: TestGenConfig
  ) {}

  async healTest(input: TestHealingInput): Promise<TestHealingResult> {
    const healingAttempts: HealingAttempt[] = [];
    let currentTestCode = await fs.readFile(input.generatedTestFile, 'utf-8');
    const originalServiceCode = await fs.readFile(
      input.originalServiceFile,
      'utf-8'
    );

    // Try fixing each error
    for (const error of input.testRunError) {
      let isErrorFixed = false;
      let attemptNumber = 1;

      while (!isErrorFixed && attemptNumber <= input.maxRetries) {
        // Build healing prompt
        const prompt = buildHealingPrompt({
          originalServiceCode,
          testCode: currentTestCode,
          error,
          previousAttempts: healingAttempts
        });
        writeDebugFile(`healing-prompt-${attemptNumber}`, prompt);

        // Get fix from LLM
        const response = await this.llm.complete({
          prompt,
          temperature: 0.2, // Lower temperature for more focused fixes
          maxTokens: this.testGenConfig.llm.maxTokens
        });

        const fixedTestCode = response.content;

        // Apply fix
        await fs.writeFile(input.generatedTestFile, fixedTestCode);
        writeDebugFile(`healing-result-${attemptNumber}`, fixedTestCode);

        // Run test to verify fix
        const testResult = await testRunner.runTest({
          testFile: input.generatedTestFile,
          timeout: this.config.timeoutPerAttempt
        });
        writeDebugFile(
          `healing-test-result-${attemptNumber}`,
          JSON.stringify(testResult, null, 2)
        );
        // Record attempt
        const attempt: HealingAttempt = {
          attemptNumber,
          error,
          fix: fixedTestCode,
          success: testResult.success
        };
        healingAttempts.push(attempt);

        // Check if error is fixed
        if (testResult.success) {
          isErrorFixed = true;
          currentTestCode = fixedTestCode;
        } else if (this.config.healingStrategy === 'conservative') {
          // In conservative mode, stop if fix introduces new errors
          const hasNewErrors = testResult.errors?.some(
            (newError) => !this.isSameError(newError, error)
          );
          if (hasNewErrors) break;
        }

        attemptNumber++;
      }

      // If error couldn't be fixed, return with remaining errors
      if (!isErrorFixed) {
        return {
          isFixed: false,
          healingAttempts,
          remainingErrors: input.testRunError.slice(
            input.testRunError.indexOf(error)
          ),
          fixedTestFile: currentTestCode
        };
      }
    }

    // All errors fixed
    return {
      isFixed: true,
      healingAttempts,
      fixedTestFile: currentTestCode
    };
  }

  private isSameError(error1: any, error2: any): boolean {
    // Basic error comparison - can be enhanced based on needs
    return (
      error1.type === error2.type &&
      error1.message === error2.message &&
      error1.location?.line === error2.location?.line
    );
  }
}

// Export a factory function
export function createTestHealer(
  config: HealingConfig,
  llm: LLMClient,
  testGenConfig: TestGenConfig
): TestHealer {
  return new TestHealer(config, llm, testGenConfig);
}

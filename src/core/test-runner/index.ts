import { exec } from 'child_process';
import { promisify } from 'util';
import { TestRunResult, TestRunOptions, TestErrorType } from './types';
import { parseJestOutput } from './error-parser';
import { parseCoverageResult } from '../coverage/parser';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export class TestRunner {
  constructor(private readonly projectRoot: string) {}

  async runTest(options: TestRunOptions): Promise<TestRunResult> {
    const startTime = Date.now();
    const coverageDir = options.collectCoverage
      ? path.join(os.tmpdir(), `jest-coverage-${Date.now()}`)
      : undefined;

    try {
      const command = this.buildJestCommand(options, coverageDir);
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.projectRoot,
        env: {
          ...process.env,
          ...options.env,
          NODE_ENV: 'test'
        },
        timeout: options.timeout || 30000
      });

      const output = stdout + '\n' + stderr;
      const errors = parseJestOutput(output);

      // Parse coverage if requested
      const coverage = coverageDir
        ? await parseCoverageResult(coverageDir)
        : undefined;

      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        rawOutput: output,
        duration: Date.now() - startTime,
        coverage
      };
    } catch (error: any) {
      // Handle Jest process errors
      return {
        success: false,
        errors: [
          {
            type: TestErrorType.UNKNOWN,
            message: error.message,
            stack: error.stack
          }
        ],
        rawOutput: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  private buildJestCommand(
    options: TestRunOptions,
    coverageDir?: string
  ): string {
    const args = [
      'npx',
      'jest',
      options.testFile,
      '--no-cache',
      '--detectOpenHandles',
      '--forceExit'
    ];

    if (options.collectCoverage && coverageDir) {
      args.push(
        '--coverage',
        '--coverageDirectory',
        coverageDir,
        '--testEnvironment=node'
      );
    }

    return args.join(' ');
  }
}

// Export a singleton instance
export const testRunner = new TestRunner(process.cwd());

import { exec } from 'child_process';
import { promisify } from 'util';
import {
  TestRunResult,
  TestRunOptions,
  TestErrorType,
  TestResultStatus,
  TestStats
} from './types';
import { parseJestOutput } from './error-parser';
import { parseCoverageResult } from '../coverage/parser';
import { findNearestJestConfig } from './config-finder';
import { defaultJestConfigs } from './default-configs';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { writeDebugFile } from '../../utils/files';

const execAsync = promisify(exec);
const tmpDir = os.tmpdir();

export class TestRunner {
  constructor(private readonly projectRoot: string) {}

  async runTest(options: TestRunOptions): Promise<TestRunResult> {
    const startTime = Date.now();
    const coverageDir = options.collectCoverage
      ? path.join(process.cwd(), `testgen-coverage`)
      : undefined;

    try {
      // Create coverage directory if needed
      if (coverageDir) {
        await fs.promises.mkdir(coverageDir, { recursive: true });
      }

      // Find nearest Jest config and project root
      const { configPath, projectRoot } = findNearestJestConfig(
        path.dirname(options.testFile)
      );

      // Create temporary config if needed
      const tempConfigPath = await this.createTempConfig(
        configPath,
        options.framework
      );

      // Ensure test file is absolute
      const testFile = path.isAbsolute(options.testFile)
        ? options.testFile
        : path.resolve(this.projectRoot, options.testFile);

      const command = this.buildJestCommand(
        testFile,
        coverageDir,
        tempConfigPath
      );

      const bashCommand = command.replace(/\\/g, '/');

      try {
        // Try running the test
        const { stdout, stderr } = await execAsync(bashCommand, {
          cwd: projectRoot || this.projectRoot,
          env: {
            ...process.env,
            ...options.env,
            NODE_ENV: 'test'
          },
          timeout: options.timeout
        });

        // Success case - all tests passed
        return await this.processTestResult({
          stdout,
          stderr,
          coverageDir,
          startTime,
          tempConfigPath,
          configPath,
          options,
          execError: undefined
        });
      } catch (execError: any) {
        // Handle non-zero exit code (test failures or execution errors)
        return await this.processTestResult({
          stdout: execError.stdout,
          stderr: execError.stderr,
          coverageDir,
          startTime,
          tempConfigPath,
          configPath,
          options,
          execError
        });
      }
    } catch (error: any) {
      console.error('error in test runner', error);
      // Cleanup coverage directory on error
      if (coverageDir) {
        await fs.promises
          .rm(coverageDir, { recursive: true, force: true })
          .catch(console.error);
      }

      // Handle Jest process errors
      const errorMessage = error.message || String(error);
      const errorType = this.determineProcessErrorType(errorMessage);

      return {
        success: false,
        status: TestResultStatus.EXECUTION_ERROR,
        errors: [
          {
            type: errorType,
            message: errorMessage,
            stack: error.stack
          }
        ],
        rawOutput: errorMessage,
        duration: Date.now() - startTime,
        testStats: {
          total: 0,
          failed: 0,
          passed: 0,
          skipped: 0
        }
      };
    }
  }

  private async processTestResult({
    stdout,
    stderr,
    coverageDir,
    startTime,
    tempConfigPath,
    configPath,
    options,
    execError
  }: {
    stdout: string;
    stderr: string;
    coverageDir?: string;
    startTime: number;
    tempConfigPath: string | null;
    configPath: string | null;
    execError?: any;
    options: TestRunOptions;
  }): Promise<TestRunResult> {
    const output = stdout + '\n' + stderr;

    try {
      // Cleanup temp config if needed
      if (tempConfigPath && tempConfigPath !== configPath) {
        await fs.promises.unlink(tempConfigPath).catch(console.error);
      }

      // Parse coverage if requested, using sourceFile if available
      const coverage = coverageDir
        ? await parseCoverageResult(coverageDir, options.sourceFile)
        : undefined;

      // Cleanup coverage directory
      // if (coverageDir) {
      //   await fs.promises
      //     .rm(coverageDir, { recursive: true, force: true })
      //     .catch(console.error);
      // }

      writeDebugFile(
        `coverage-${Date.now()}`,
        JSON.stringify(coverage, null, 2)
      );

      // Parse the output to determine test status
      const errors = parseJestOutput(output);
      const hasExecutionError = output.includes('Test suite failed to run');
      const testStats = this.parseTestStats(output);

      // Determine final status
      const status = this.determineTestStatus(hasExecutionError, testStats);

      return {
        success: status === TestResultStatus.SUCCESS,
        status,
        errors: hasExecutionError
          ? [
              {
                type: TestErrorType.UNKNOWN,
                message: execError?.message || String(execError),
                stack: execError?.stack
              }
            ]
          : errors.length > 0
            ? errors
            : undefined,
        rawOutput: output,
        duration: Date.now() - startTime,
        coverage,
        testStats
      };
    } catch (error) {
      // Handle errors in processing results
      return {
        success: false,
        status: TestResultStatus.EXECUTION_ERROR,
        errors: [
          {
            type: TestErrorType.UNKNOWN,
            message: String(error),
            stack: error instanceof Error ? error.stack : undefined
          }
        ],
        rawOutput: output,
        duration: Date.now() - startTime,
        testStats: {
          total: 0,
          failed: 0,
          passed: 0,
          skipped: 0
        }
      };
    }
  }

  private parseTestStats(output: string): TestStats {
    // Parse "Tests: X failed, Y total" line
    const statsMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+total/);
    if (!statsMatch) {
      return { total: 0, failed: 0, passed: 0, skipped: 0 };
    }

    const failed = parseInt(statsMatch[1], 10);
    const total = parseInt(statsMatch[2], 10);

    return {
      total,
      failed,
      passed: total - failed,
      skipped: 0 // We can enhance this later if needed
    };
  }

  private determineTestStatus(
    hasExecutionError: boolean,
    stats: TestStats
  ): TestResultStatus {
    if (hasExecutionError) {
      return TestResultStatus.EXECUTION_ERROR;
    }
    if (stats.failed > 0) {
      return TestResultStatus.TEST_FAILURES;
    }
    return TestResultStatus.SUCCESS;
  }

  private determineProcessErrorType(errorMessage: string): TestErrorType {
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes('syntax')) return TestErrorType.SYNTAX;
    if (lowerError.includes('cannot find module'))
      return TestErrorType.DEPENDENCY;
    if (lowerError.includes('timeout')) return TestErrorType.TIMEOUT;
    if (
      lowerError.includes('type error') ||
      lowerError.includes('reference error')
    ) {
      return TestErrorType.RUNTIME;
    }

    return TestErrorType.UNKNOWN;
  }

  private async createTempConfig(
    existingConfigPath: string | null,
    framework?: string
  ): Promise<string | null> {
    // If config exists, return its path
    if (existingConfigPath) return existingConfigPath;

    // If no framework specified, use default config
    const config = framework
      ? defaultJestConfigs[framework]
      : defaultJestConfigs.default;

    // Create temporary config file
    const tempConfigPath = path.join(tmpDir, `jest.config.${Date.now()}.json`);
    await fs.promises.writeFile(
      tempConfigPath,
      JSON.stringify(
        {
          ...config,
          coverageReporters: ['json', 'json-summary'],
          collectCoverage: true,
          collectCoverageFrom: [
            '**/*.{js,jsx,ts,tsx}',
            '!**/*.d.ts',
            '!**/node_modules/**',
            '!**/vendor/**'
          ],
          rootDir: process.cwd()
        },
        null,
        2
      )
    );
    return tempConfigPath;
  }

  private buildJestCommand(
    testFile: string,
    coverageDir?: string,
    configPath?: string | null
  ): string {
    const args = [
      'npx',
      'jest',
      `"${testFile}"`, // Quote the test file path
      '--no-cache',
      '--detectOpenHandles'
      // '--forceExit'
    ];

    // Add config if available
    if (configPath) {
      args.push('--config', `"${configPath}"`);
    }

    // Add coverage options
    if (coverageDir) {
      args.push(
        '--coverage',
        '--coverageDirectory',
        `"${coverageDir}"`,
        '--coverageReporters json',
        '--coverageReporters json-summary'
      );
    }

    return args.join(' ');
  }
}

// Export a singleton instance
export const testRunner = new TestRunner(process.cwd());

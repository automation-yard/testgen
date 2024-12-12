import { exec } from 'child_process';
import { promisify } from 'util';
import { TestRunResult, TestRunOptions, TestErrorType } from './types';
import { parseJestOutput } from './error-parser';
import { parseCoverageResult } from '../coverage/parser';
import { findNearestJestConfig } from './config-finder';
import { defaultJestConfigs } from './default-configs';
import path from 'path';
import os from 'os';
import fs from 'fs';

const execAsync = promisify(exec);
const tmpDir = os.tmpdir();

export class TestRunner {
  constructor(private readonly projectRoot: string) {}

  async runTest(options: TestRunOptions): Promise<TestRunResult> {
    const startTime = Date.now();
    const coverageDir = options.collectCoverage
      ? path.join(tmpDir, `jest-coverage-${Date.now()}`)
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

      const { stdout, stderr } = await execAsync(command, {
        cwd: projectRoot || this.projectRoot,
        env: {
          ...process.env,
          ...options.env,
          NODE_ENV: 'test',
          JEST_COVERAGE_DIR: coverageDir // Pass coverage dir to Jest
        },
        timeout: options.timeout || 30000
      });

      // Cleanup temp config
      if (tempConfigPath && tempConfigPath !== configPath) {
        await fs.promises.unlink(tempConfigPath).catch(console.error);
      }

      const output = stdout + '\n' + stderr;
      const errors = parseJestOutput(output);

      // Parse coverage if requested
      const coverage = coverageDir
        ? await parseCoverageResult(coverageDir)
        : undefined;

      // Cleanup coverage directory
      if (coverageDir) {
        await fs.promises
          .rm(coverageDir, { recursive: true, force: true })
          .catch(console.error);
      }

      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        rawOutput: output,
        duration: Date.now() - startTime,
        coverage
      };
    } catch (error: any) {
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
        errors: [
          {
            type: errorType,
            message: errorMessage,
            stack: error.stack
          }
        ],
        rawOutput: errorMessage,
        duration: Date.now() - startTime
      };
    }
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
      '--detectOpenHandles',
      '--forceExit'
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
        '--coverageReporters=json,json-summary',
        '--collectCoverage=true'
      );
    }

    return args.join(' ');
  }
}

// Export a singleton instance
export const testRunner = new TestRunner(process.cwd());

import { CoverageResult } from '../coverage/types';

export enum TestResultStatus {
  SUCCESS = 'SUCCESS',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  TEST_FAILURES = 'TEST_FAILURES'
}

export interface TestStats {
  total: number;
  failed: number;
  passed: number;
  skipped: number;
}

export interface TestRunResult {
  success: boolean;
  status: TestResultStatus;
  errors?: TestError[];
  rawOutput: string;
  duration: number;
  coverage?: CoverageResult;
  testStats?: TestStats;
}

export interface TestError {
  type: TestErrorType;
  message: string;
  stack?: string;
  location?: {
    line: number;
    column: number;
    file: string;
  };
}

export enum TestErrorType {
  SYNTAX = 'SYNTAX',
  RUNTIME = 'RUNTIME',
  DEPENDENCY = 'DEPENDENCY',
  ASSERTION = 'ASSERTION',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface TestRunOptions {
  testFile: string;
  sourceFile?: string;
  timeout?: number;
  env?: Record<string, string>;
  collectCoverage?: boolean;
  framework?: 'react' | 'nextjs' | 'express' | 'nestjs';
}

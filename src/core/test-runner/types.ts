import { CoverageResult } from '../coverage/types';

export interface TestRunResult {
  success: boolean;
  errors?: TestError[];
  rawOutput: string;
  duration: number;
  coverage?: CoverageResult;
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
  timeout?: number;
  env?: Record<string, string>;
  collectCoverage?: boolean;
  framework?: 'react' | 'nextjs' | 'express' | 'nestjs';
}

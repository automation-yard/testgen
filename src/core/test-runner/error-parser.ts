import { TestError, TestErrorType } from './types';

export function parseJestOutput(output: string): TestError[] {
  const errors: TestError[] = [];
  const lines = output.split('\n');

  let currentError: Partial<TestError> | null = null;
  let stackLines: string[] = [];

  for (const line of lines) {
    // Jest error patterns
    if (line.includes('● ')) {
      // Save previous error if exists
      if (currentError?.message) {
        errors.push({
          ...currentError,
          stack: stackLines.join('\n')
        } as TestError);
      }

      // Start new error
      currentError = {
        type: determineErrorType(line),
        message: line.split('● ')[1]?.trim()
      };
      stackLines = [];
    }
    // Location pattern (file path with line/column)
    else if (line.match(/^\s+at.*\((.*):(\d+):(\d+)\)$/)) {
      const match = line.match(/^\s+at.*\((.*):(\d+):(\d+)\)$/);
      if (match && currentError) {
        currentError.location = {
          file: match[1],
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10)
        };
      }
      stackLines.push(line.trim());
    }
    // Stack trace lines
    else if (line.trim().startsWith('at ')) {
      stackLines.push(line.trim());
    }
  }

  // Add last error if exists
  if (currentError?.message) {
    errors.push({
      ...currentError,
      stack: stackLines.join('\n')
    } as TestError);
  }

  return errors;
}

function determineErrorType(errorLine: string): TestErrorType {
  const lowerError = errorLine.toLowerCase();

  if (
    lowerError.includes('cannot find module') ||
    lowerError.includes('is not defined')
  ) {
    return TestErrorType.DEPENDENCY;
  }

  if (
    lowerError.includes('syntax') ||
    lowerError.includes('unexpected token')
  ) {
    return TestErrorType.SYNTAX;
  }

  if (lowerError.includes('expect(') || lowerError.includes('assertion')) {
    return TestErrorType.ASSERTION;
  }

  if (lowerError.includes('timeout')) {
    return TestErrorType.TIMEOUT;
  }

  if (
    lowerError.includes('runtime error') ||
    lowerError.includes('type error')
  ) {
    return TestErrorType.RUNTIME;
  }

  return TestErrorType.UNKNOWN;
}

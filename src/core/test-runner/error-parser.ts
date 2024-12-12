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

  // Syntax errors
  if (
    lowerError.includes('unexpected token') ||
    lowerError.includes('unexpected end of input') ||
    lowerError.includes('unexpected identifier') ||
    lowerError.includes('syntax error')
  ) {
    return TestErrorType.SYNTAX;
  }

  // Dependency errors
  if (
    lowerError.includes('cannot find module') ||
    lowerError.includes('module not found') ||
    lowerError.includes('is not defined') ||
    lowerError.includes('reference error')
  ) {
    return TestErrorType.DEPENDENCY;
  }

  // Assertion errors
  if (
    lowerError.includes('expected') ||
    lowerError.includes('assertion') ||
    lowerError.includes('expect(') ||
    lowerError.includes('matcher') ||
    lowerError.includes('received')
  ) {
    return TestErrorType.ASSERTION;
  }

  // Runtime errors
  if (
    lowerError.includes('type error') ||
    lowerError.includes('cannot read property') ||
    lowerError.includes('is not a function') ||
    lowerError.includes('undefined is not an object')
  ) {
    return TestErrorType.RUNTIME;
  }

  // Timeout errors
  if (
    lowerError.includes('timeout') ||
    lowerError.includes('timed out') ||
    lowerError.includes('async callback was not invoked')
  ) {
    return TestErrorType.TIMEOUT;
  }

  return TestErrorType.UNKNOWN;
}

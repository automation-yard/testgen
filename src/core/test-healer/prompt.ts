import { HealingPromptParams } from './types';
import { TestErrorType } from '../test-runner/types';

export function buildHealingPrompt(params: HealingPromptParams): string {
  const { originalServiceCode, testCode, error, previousAttempts } = params;

  const basePrompt = `
You are a test healing expert. Your task is to fix a failing test based on the following information:

Original Service Code:
\`\`\`typescript
${originalServiceCode}
\`\`\`

Current Test Code:
\`\`\`typescript
${testCode}
\`\`\`

Error:
Type: ${error.type}
Message: ${error.message}
${
  error.location
    ? `Location: Line ${error.location.line}, Column ${error.location.column}`
    : ''
}
${error.stack ? `Stack: ${error.stack}` : ''}

${
  previousAttempts.length > 0
    ? `
Previous Fix Attempts:
${previousAttempts
  .map(
    (attempt, i) => `
Attempt ${attempt.attemptNumber}:
${attempt.fix}
Result: ${attempt.success ? 'Success' : 'Failed'}
`
  )
  .join('\n')}
`
    : ''
}

Please provide a fix for this test. Focus on:
${getErrorTypeSpecificInstructions(error.type)}

Respond with ONLY the complete fixed test code. Do not include any explanations or markdown formatting.`;

  return basePrompt;
}

function getErrorTypeSpecificInstructions(errorType: TestErrorType): string {
  switch (errorType) {
    case TestErrorType.DEPENDENCY:
      return `
- Missing import statements
- Incorrect module paths
- Missing mock implementations
- Required dependency setup
- Mock factory implementations`;

    case TestErrorType.SYNTAX:
      return `
- Syntax errors in the test code
- Missing brackets or parentheses
- TypeScript type errors
- Invalid test structure
- Malformed assertions`;

    case TestErrorType.ASSERTION:
      return `
- Incorrect assertion expectations
- Missing test setup
- Incorrect mock return values
- Async/await usage
- Before/after hooks setup`;

    case TestErrorType.RUNTIME:
      return `
- Runtime error handling
- Undefined object access
- Async operation handling
- Mock implementation errors
- Test environment setup`;

    case TestErrorType.TIMEOUT:
      return `
- Async test timeouts
- Promise resolution
- Done() callback usage
- Test cleanup
- Resource cleanup`;

    default:
      return `
- General test structure
- Mock implementations
- Assertion correctness
- Error handling
- Test environment setup`;
  }
}

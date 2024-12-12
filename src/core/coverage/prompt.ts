import { CoverageResult } from './types'

export interface CoveragePromptParams {
  targetCode: string
  currentTestCode: string
  coverage: CoverageResult
  previousAttempts: Array<{
    testCode: string
    coverage: CoverageResult
  }>
}

export function buildCoveragePrompt(params: CoveragePromptParams): string {
  const { targetCode, currentTestCode, coverage, previousAttempts } = params

  return `
You are a test coverage expert. Your task is to enhance test coverage for the following code:

Target Code:
\`\`\`typescript
${targetCode}
\`\`\`

Current Test Code:
\`\`\`typescript
${currentTestCode}
\`\`\`

Current Coverage:
- Statements: ${coverage.statements}%
- Branches: ${coverage.branches}%
- Functions: ${coverage.functions}%
- Lines: ${coverage.lines}%

Uncovered Areas:
${coverage.uncoveredLines.length > 0 ? `Lines: ${coverage.uncoveredLines.join(', ')}` : 'All lines covered'}
${coverage.uncoveredFunctions.length > 0 ? `Functions: ${coverage.uncoveredFunctions.join(', ')}` : 'All functions covered'}
${coverage.uncoveredBranches.length > 0 ? `Branches: ${coverage.uncoveredBranches.join(', ')}` : 'All branches covered'}

${previousAttempts.length > 0 ? `
Previous Enhancement Attempts:
${previousAttempts.map((attempt, i) => `
Attempt ${i + 1}:
${attempt.testCode}
Coverage Result:
- Statements: ${attempt.coverage.statements}%
- Branches: ${attempt.coverage.branches}%
- Functions: ${attempt.coverage.functions}%
- Lines: ${attempt.coverage.lines}%
`).join('\n')}
` : ''}

Please enhance the test coverage by:
1. Adding test cases for uncovered lines
2. Testing all branch conditions
3. Adding tests for uncovered functions
4. Ensuring edge cases are covered
5. Maintaining existing test structure and naming conventions

Respond with ONLY the complete enhanced test code. Do not include any explanations or markdown formatting.`
} 
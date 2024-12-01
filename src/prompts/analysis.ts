import { FrameworkRules } from './frameworks/types';

export interface AnalysisPromptParams {
  methodCode: string;
  dependenciesCode: string;
  frameworkRules: FrameworkRules;
}

export function buildAnalysisPrompt(params: AnalysisPromptParams): string {
  const { methodCode, dependenciesCode, frameworkRules } = params;

  return `
Analyze the following code for test generation:

Method Code:
${methodCode}

Dependencies:
${dependenciesCode}

Framework: ${frameworkRules.name}

Please provide a detailed analysis in this structure:

1. Code Dependencies
- List all dependencies required by the code
- Identify dependency injection patterns used
- Note required methods and interfaces
- Map dependencies to their implementations

2. Method Analysis
- Input parameters and types
- Return type and structure
- Error conditions and types
- External service calls
- State changes and side effects

3. Test Requirements
- Success scenarios
- Error scenarios
- Edge cases
- Mock requirements
- Data requirements

4. Framework-Specific Analysis
${frameworkRules.analysisInstructions || ''}

Please ensure all dependencies are properly identified and analyzed for testing.
End your analysis with a summary of key testing priorities and potential implementation challenges.`;
}

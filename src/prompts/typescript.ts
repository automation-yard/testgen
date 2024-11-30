export interface PromptParams {
  methodName: string;
  methodCode: string;
  dependenciesCode: string;
  userContext: string;
  allImports: string;
  analysis: string;
  exportType: "default" | "named" | "unknown";
}

export const typescriptPrompt = (params: PromptParams): string => {
  const {
    methodName,
    methodCode,
    dependenciesCode,
    userContext,
    allImports,
    analysis,
    exportType,
  } = params;

  return `
You are an expert in TypeScript unit testing using Jest. Your task is to create comprehensive unit tests for a specific method.
Given the following details:

Export Type:
${exportType}

Code Analysis:
${analysis}

Dependencies:
${dependenciesCode}

Import Statements:
${allImports}

Method Details:
Function Name: "${methodName}"
Code:
${methodCode}
Additional Context:
${userContext}

Generate comprehensive unit tests following these specific requirements:

1. Test File Structure:
- Use ES6 import statements
- Format: import { ClassName, namedExport } from '../path-to-module'
- Format for default exports: import DefaultExport from '../path-to-module'
- Include proper test suite organization
- Include before/after hooks if needed

2. Mocking Requirements:
- Use jest.mock() for external dependencies
- Use jest.spyOn() for method spying
- Reset all mocks in beforeEach/afterEach hooks
- Clear mock implementations between tests
- Mock return values and implementations as needed
- Ensure mock objects fully implement required interfaces/types
- Include all required properties for interface/type compliance
- Add type assertions to mocks when needed

3. Test Categories:
- Happy path scenarios
- Error cases and exception handling
- Edge cases and boundary values
- Input validation
- Asynchronous behavior (if applicable)
- Integration with dependencies
- Type validation

4. Test Structure:
- Follow AAA pattern (Arrange, Act, Assert)
- Group related tests using describe blocks
- Use clear, descriptive test names
- Include setup and teardown as needed

5. Coverage Requirements:
- Test all possible method parameters
- Test all return types
- Test all error conditions
- Test type constraints
- Ensure mock objects satisfy TypeScript interfaces
- Test null/undefined handling
- Test empty/invalid inputs
- Validate all required interface properties are present

Begin with the test code immediately after receiving this prompt, with no additional text or formatting.`;
};

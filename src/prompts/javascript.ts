import { PromptParams } from "./typescript";

export const javascriptPrompt = (params: PromptParams): string => {
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
You are an expert in JavaScript unit testing using Jest. Your task is to create comprehensive unit tests for a specific method.
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
- Use CommonJS require statements
- Format: const { ClassName, namedExport } = require('../path-to-module')
- Format for default exports: const DefaultExport = require('../path-to-module').default
- Include proper test suite organization
- Include before/after hooks if needed

2. Mocking Requirements:
- Use jest.mock() for external dependencies
- Use jest.spyOn() for method spying
- Reset all mocks in beforeEach/afterEach hooks
- Clear mock implementations between tests
- Mock return values and implementations as needed

3. Test Categories:
- Happy path scenarios
- Error cases and exception handling
- Edge cases and boundary values
- Input validation
- Asynchronous behavior (if applicable)
- Integration with dependencies

4. Test Structure:
- Follow AAA pattern (Arrange, Act, Assert)
- Group related tests using describe blocks
- Use clear, descriptive test names
- Include setup and teardown as needed

5. Coverage Requirements:
- Test all possible method parameters
- Test all return types
- Test all error conditions
- Test null/undefined handling
- Test empty/invalid inputs

Begin with the test code immediately after receiving this prompt, with no additional text or formatting.`;
};

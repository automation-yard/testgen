// src/testGenerator.ts
import { JavaScriptExample, TypescriptExample } from "./common";
import { LLMClient } from "./llm-client";
import path from "path";

export class TestGenerator {
  private inputFilePath!: string;

  constructor(private llmClient: LLMClient) {}

  public async generateTestsForMethod(
    methodName: string,
    methodCode: string,
    dependenciesCode: string,
    userContext: string,
    inputFileImports: string[],
    dependenciesImports: string[],
    analysis: string,
    isJavaScript: boolean,
    exportType: "default" | "named" | "unknown",
    inputFilePath: string,
    fileName: string,
    classImportStatememts: string[]
  ): Promise<{ code: string; filePath: string }> {
    this.inputFilePath = inputFilePath;

    // Combine and deduplicate imports
    const allImports = Array.from(
      new Set([...inputFileImports, ...dependenciesImports, ...classImportStatememts])
    ).join("\n");

    const prompt = `
You are an expert in JavaScript/TypeScript unit testing using Jest in Node.js, NestJS, or SailsJS frameworks. Your task is to create comprehensive unit tests for a specific method.
Given the following details:

Language:
${isJavaScript ? "JavaScript" : "TypeScript"}

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

- Use proper file naming convention: ${fileName}.${methodName}.spec.${
      isJavaScript ? "js" : "ts"
    }
- Include necessary import statements based on language
- Include proper test suite organization
- Include before/after hooks if needed


2. Import Requirements:
- Use ${isJavaScript ? "CommonJS require statements" : "ES6 import statements"}
- Format for CommonJS: const { ClassName, namedExport } = require('../path-to-module')
- Format for default exports in CommonJS: const DefaultExport = require('../path-to-module').default
- Format for ES6 imports: import { ClassName, namedExport } from '../path-to-module'
- Format for default exports in ES6: import DefaultExport from '../path-to-module'


3. Mocking Requirements:

- Use jest.mock() for external dependencies
- Use jest.spyOn() for method spying
- Reset all mocks in beforeEach/afterEach hooks
- Clear mock implementations between tests
- Mock return values and implementations as needed
- Ensure mock objects fully implement required interfaces/types
- Include all required properties for interface/type compliance
- For TypeScript: Add type assertions to mocks when needed


4. Test Categories to Include:

- Happy path scenarios
- Error cases and exception handling
- Edge cases and boundary values
- Input validation
- Asynchronous behavior (if applicable)
- Property-based testing for input combinations
- Integration with dependencies
- Type validation (for TypeScript)


5. Test Structure:

- Follow AAA pattern (Arrange, Act, Assert) strictly
- Group related tests using describe blocks
- Use clear, descriptive test names
- Include setup and teardown as needed


6. Coverage Requirements:

- Test all possible method parameters
- Test all return types
- Test all error conditions
- Test type constraints (TypeScript)
- Ensure mock objects satisfy TypeScript interfaces
- Test null/undefined handling
- Test empty/invalid inputs
- Validate all required interface properties are present

7. Output Requirements:

- Provide only the test file code
- No explanations or markdown
- No code block formatting
- Include all necessary imports and mocks
- Do not include unnecessary imports or code
- Follow consistent spacing and formatting

Note: After generating the tests, verify all possible use cases are covered before outputting the final code.
Begin with the test code immediately after receiving this prompt, with no additional text or formatting.
${isJavaScript ? JavaScriptExample : TypescriptExample}
`;

    let response = await this.llmClient.generateText(prompt);

    // Post-process the response to extract only code
    response = this.extractCode(response);

    // In generateTestsForMethod function, after extractCode
    response = this.replacePlaceholderPaths(response);

    // Generate test file path in same directory as input file
    const inputDir = path.dirname(inputFilePath);
    const testFileName = `${fileName}.${methodName.toLowerCase()}.test.${isJavaScript ? 'js' : 'ts'}`;
    const testFilePath = path.join(inputDir, testFileName);

    return {
      code: response,
      filePath: testFilePath
    };
  }

  private extractCode(response: string): string {
    // Remove any markdown code blocks and extract code
    const codeBlockRegex = /```(?:javascript|typescript)?\n([\s\S]*?)```/g;
    let code = response;

    // Remove code blocks if present
    if (codeBlockRegex.test(response)) {
      code = response.replace(codeBlockRegex, "$1");
    }

    // Remove any markdown or extra text
    code = code.replace(/^\s*[\*\-]\s+.*$/gm, ""); // Remove bullet points
    code = code.trim();

    return code;
  }

  private replacePlaceholderPaths(code: string): string {
    const inputDir = path.dirname(this.inputFilePath);
    const baseFilename = path.basename(this.inputFilePath, path.extname(this.inputFilePath));
    
    // Replace imports with correct relative paths
    return code.replace(
      /(from|require\()['"]\..*?['"]/g,
      (match) => {
        const importType = match.startsWith('from') ? 'from' : 'require(';
        const importPath = match.match(/['"](.+?)['"]/)?.[1];
        if (!importPath) return match;

        // Get the import name from the full import statement
        const importStatement = match.split('\n')[0];
        const importNames = importStatement.match(/\{([^}]+)\}/)?.[1].split(',').map(s => s.trim());

        // Handle different types of imports
        if (importPath.endsWith('/service') || importPath.includes(baseFilename)) {
          // Main service file import
          return `${importType} './${baseFilename}'`;
        } else if (importNames?.some(name => ['Product', 'Order', 'Customer'].includes(name))) {
          // Models import
          return `${importType} './models'`;
        } else if (importNames?.some(name => ['calculateDiscount', 'sendOrderConfirmation'].includes(name))) {
          // Utils import
          return `${importType} './utils'`;
        }
        
        return match;
      }
    );
  }
}

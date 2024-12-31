import { getFrameworkRules } from './frameworks';

export interface PromptParams {
  methodName: string;
  methodCode: string;
  dependenciesCode: string;
  userContext: string;
  allImports: string;
  analysis: string;
  exportType: 'default' | 'named' | 'unknown';
  framework: string;
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
    framework
  } = params;

  const frameworkRules = getFrameworkRules(framework);

  return `
You are an expert in TypeScript unit testing, specializing in ${
    frameworkRules.name
  } applications using Jest.
Your task is to create comprehensive unit tests following ${
    frameworkRules.name
  } best practices.

Project Context:
Framework: ${frameworkRules.name}
Testing Environment: Jest with TypeScript

Required Imports:
${allImports}

Code Analysis:
${analysis}

Dependencies:
${dependenciesCode}

Method Details:
Function Name: "${methodName}"
Code:
${methodCode}
Additional Context:
${userContext}

Generate comprehensive unit tests following these specific requirements:

1. Framework-Specific Setup:
${frameworkRules.testingModuleSetup || ''}

2. Mocking Requirements:
${frameworkRules.mockingPatterns.join('\n')}

3. Test Structure:
${frameworkRules.testStructure.join('\n')}

4. Special Considerations:
Edge Cases:
${frameworkRules.edgeCases.join('\n')}

Best Practices:
${frameworkRules.bestPractices.join('\n')}

${
  frameworkRules.dependencyInjection
    ? `
5. Dependency Injection:
Patterns:
${frameworkRules.dependencyInjection.patterns.join('\n')}

Mocking Strategy:
${frameworkRules.dependencyInjection.mockingStrategy.join('\n')}
`
    : ''
}

${
  frameworkRules.decorators
    ? `
6. Decorator Handling:
Patterns:
${frameworkRules.decorators.patterns.join('\n')}

Testing Strategy:
${frameworkRules.decorators.testingStrategy.join('\n')}
`
    : ''
}

Begin with the test code immediately after receiving this prompt, with no additional text or formatting. Strictly no explanation. Just output the final code.
Strictly use the file naming convention as: ${frameworkRules.testFileNaming}`;
};

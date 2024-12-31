import path from 'path';
import { LLMClient } from '../../llm/types';
import { javascriptPrompt, typescriptPrompt } from '../../prompts';
import { ConfigLoader } from '../../config/loader';
import { writeDebugFile } from '../../utils/files';

export class TestGenerator {
  private inputFilePath!: string;
  private configLoader: ConfigLoader;

  constructor(private llmClient: LLMClient) {
    this.configLoader = new ConfigLoader();
  }

  public async generateTestsForMethod(
    methodName: string,
    methodCode: string,
    dependenciesCode: string,
    userContext: string,
    inputFileImports: string[],
    dependenciesImports: string[],
    analysis: string,
    isJavaScript: boolean,
    exportType: 'default' | 'named' | 'unknown',
    inputFilePath: string,
    fileName: string,
    classImportStatememts: string[]
  ): Promise<{ code: string; filePath: string }> {
    this.inputFilePath = inputFilePath;

    // Load configuration to get framework info
    const config = await this.configLoader.loadConfig();

    // Combine and deduplicate imports
    const allImports = Array.from(
      new Set([
        ...inputFileImports,
        ...dependenciesImports,
        ...classImportStatememts
      ])
    ).join('\n');

    const prompt = this.buildPrompt({
      methodName,
      methodCode,
      dependenciesCode,
      userContext,
      allImports,
      analysis,
      isJavaScript,
      exportType,
      framework: config.framework
    });

    writeDebugFile(`${config.llm.provider}-test-generator-prompt`, prompt);
    const response = await this.llmClient.generateText(prompt);
    let code = response.content;

    // Post-process the response
    code = this.extractCode(code);
    code = this.replacePlaceholderPaths(code);

    // Generate test file path in same directory as input file
    const inputDir = path.dirname(inputFilePath);

    const testFileName = `${fileName}.${methodName.toLowerCase()}.spec.${
      isJavaScript ? 'js' : 'ts'
    }`;
    const testFilePath = path.join(inputDir, testFileName);

    return {
      code,
      filePath: testFilePath
    };
  }

  private buildPrompt(params: {
    methodName: string;
    methodCode: string;
    dependenciesCode: string;
    userContext: string;
    allImports: string;
    analysis: string;
    isJavaScript: boolean;
    exportType: 'default' | 'named' | 'unknown';
    framework: string;
  }): string {
    const template = params.isJavaScript ? javascriptPrompt : typescriptPrompt;
    return template(params);
  }

  private extractCode(response: string): string {
    // Remove any markdown code blocks and extract code
    const codeBlockRegex =
      /\`\`\`(?:javascript|typescript)?\n([\s\S]*?)\`\`\`/g;
    let code = response;

    // Remove code blocks if present
    if (codeBlockRegex.test(response)) {
      code = response.replace(codeBlockRegex, '$1');
    }

    // Remove any markdown or extra text
    code = code.replace(/^\s*[\*\-]\s+.*$/gm, ''); // Remove bullet points
    code = code.trim();

    return code;
  }

  private replacePlaceholderPaths(code: string): string {
    const inputDir = path.dirname(this.inputFilePath);
    const baseFilename = path.basename(
      this.inputFilePath,
      path.extname(this.inputFilePath)
    );

    // Replace imports with correct relative paths
    return code.replace(/(from|require\()['"]\..*?['"]/g, (match) => {
      const importType = match.startsWith('from') ? 'from' : 'require(';
      const importPath = match.match(/['"](.+?)['"]/)?.[1];
      if (!importPath) return match;

      // Get the import name from the full import statement
      const importStatement = match.split('\n')[0];
      const importNames = importStatement
        .match(/\{([^}]+)\}/)?.[1]
        .split(',')
        .map((s) => s.trim());

      // Handle different types of imports
      if (
        importPath.endsWith('/service') ||
        importPath.includes(baseFilename)
      ) {
        // Main service file import
        return `${importType} './${baseFilename}'`;
      } else if (
        importNames?.some((name) =>
          ['Product', 'Order', 'Customer'].includes(name)
        )
      ) {
        // Models import
        return `${importType} './models'`;
      } else if (
        importNames?.some((name) =>
          ['calculateDiscount', 'sendOrderConfirmation'].includes(name)
        )
      ) {
        // Utils import
        return `${importType} './utils'`;
      }

      return match;
    });
  }
}

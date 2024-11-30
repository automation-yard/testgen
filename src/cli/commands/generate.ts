import { Command } from "commander";
import { ConfigLoader } from "../../config/loader";
import { CodeBundler } from "../../core/bundler";
import { TestGenerator } from "../../core/generator";
import { AnthropicClient } from "../../llm/anthropic";
import { OpenAIClient } from "../../llm/openai";
import { LLMClient } from "../../llm/types";
import { GenerateCommandOptions } from "../types";
import { Method } from "../../types/bundler";
import * as readline from "readline";
import ora from "ora";
import fs from "fs";
import path from "path";

export function createGenerateCommand(): Command {
  const command = new Command("generate")
    .description("Generate tests for a file or method")
    .argument("<file>", "The file to generate tests for")
    .option("-m, --method <method>", "Specific method to generate tests for")
    .option("-p, --provider <provider>", "LLM provider (openai or anthropic)")
    .option("-k, --api-key <key>", "API key for the LLM provider")
    .action(async (file: string, options: GenerateCommandOptions) => {
      try {
        const spinner = ora();

        // Load configuration
        const configLoader = new ConfigLoader();
        const config = await configLoader.loadConfig();

        // Setup LLM client
        const provider = options.provider || config.llm.provider;
        const apiKey =
          options.apiKey || process.env[`${provider.toUpperCase()}_API_KEY`];

        if (!apiKey) {
          throw new Error(
            `No API key provided for ${provider}. Set ${provider.toUpperCase()}_API_KEY environment variable or use --api-key option.`
          );
        }

        const llmClient = createLLMClient(provider, apiKey);

        // Bundle the code
        const entryFilePath = path.resolve(file);
        const fileName = path.basename(entryFilePath).split(".")[0];
        const bundler = new CodeBundler(entryFilePath, options.method);

        spinner.start("Bundling code...");
        const bundleResult = bundler.bundle();
        spinner.succeed("Code bundled successfully");

        if (bundleResult.message) {
          console.log(bundleResult.message);
        }

        // Get user context if not in CI
        let userContext = "";
        if (process.env.CI !== "true") {
          userContext = await getUserContext();
        }

        // Generate tests for each method
        const testGenerator = new TestGenerator(llmClient);
        const methodsToProcess = options.method
          ? bundleResult.methods.filter((m: Method) =>
              m.name
                .toLocaleLowerCase()
                .includes(options.method!.toLocaleLowerCase())
            )
          : bundleResult.methods;

        if (options.method && methodsToProcess.length === 0) {
          throw new Error(
            `Method "${options.method}" not found in the source file.`
          );
        }

        for (const method of methodsToProcess) {
          spinner.start(`Analyzing method: ${method.name}`);
          const analysis = await analyzeMethod(
            method,
            bundleResult.dependenciesCode,
            llmClient
          );
          spinner.succeed(`Analysis complete for ${method.name}`);

          spinner.start(`Generating tests for method: ${method.name}`);
          const result = await testGenerator.generateTestsForMethod(
            method.name,
            method.code,
            bundleResult.dependenciesCode,
            userContext,
            bundleResult.inputFileImports,
            bundleResult.dependenciesImports,
            analysis,
            bundleResult.isJavaScript,
            bundleResult.exportType,
            entryFilePath,
            fileName,
            bundleResult.classImportStatements
          );

          fs.writeFileSync(result.filePath, result.code);
          spinner.succeed(
            `Tests generated for ${method.name} at ${result.filePath}`
          );
        }
      } catch (error) {
        console.error(
          "Error:",
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });

  return command;
}

function createLLMClient(provider: string, apiKey: string): LLMClient {
  switch (provider.toLowerCase()) {
    case "anthropic":
      return new AnthropicClient(apiKey);
    case "openai":
      return new OpenAIClient(apiKey);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

async function getUserContext(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>((resolve) => {
    rl.question(
      "Please provide additional context if any (or press Enter to skip):\n",
      (answer) => {
        rl.close();
        resolve(answer);
      }
    );
  });
}

async function analyzeMethod(
  method: Method,
  dependenciesCode: string,
  llmClient: LLMClient
): Promise<string> {
  const analysisPrompt = `
Analyze the following method and its dependencies for test generation:

Method:
${method.code}

Dependencies:
${dependenciesCode}

Please provide analysis in the following structured format:
1. Code Overview
- High-level description of the code's purpose
- Architecture/design patterns used
- External dependencies and their roles

2. Function Analysis
- Function name and signature
- Purpose and responsibility
- Input parameters with types and constraints
- Expected output/return values
- Error cases and expected error handling
- Dependencies and side effects
- Async/sync behavior

3. Data Flow
- Input/output relationships between functions
- Data transformations
- State management (if applicable)

4. Testing Requirements
For each function, outline:
- Required test scenarios
- Edge cases to cover
- Mocking requirements for dependencies
- Expected success cases
- Expected failure cases
- Performance considerations

5. Security Considerations
- Input validation requirements
- Authentication/authorization checks
- Data sanitization needs
- Potential security vulnerabilities to test

Please provide specific code examples where relevant to illustrate complex scenarios or edge cases.
End your analysis with a summary of key testing priorities and potential implementation challenges.
`;

  return await llmClient.generateText(analysisPrompt);
}

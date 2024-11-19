#!/usr/bin/env node

import { CodeBundler } from "./code-bundler";
import { LLMClient } from "./llm-client";
import { OpenAIClient } from "./openai-client";
import { AnthropicClient } from "./anthropic-client";
import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";
const ora = require("ora");
import dotenv from "dotenv";
import { TestGenerator } from "./test-generator";

dotenv.config();

interface CliOptions {
  entryFile: string;
  apiKey: string;
  llmProvider: string;
  methodName?: string;
}

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  const entryFile = args[0];
  const methodName = args[1];
  const apiKey =
    process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || args[2];
  const llmProvider = args[3] || process.env.LLM_PROVIDER || "openai";

  if (!entryFile || !apiKey) {
    if (!entryFile) console.error("entryFile is required");
    if (!apiKey) {
      console.error(
        "api key is not provided, you can set the OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable."
      );
    }
    console.error(
      "Usage: testgen <entryFile> [methodName] [apiKey] [llmProvider]"
    );
    console.error("Examples:");
    console.error("  Generate tests for all methods:");
    console.error("    testgen ./src/service.ts");
    console.error("  Generate tests for specific method:");
    console.error("    testgen ./src/service.ts createOrder");
    console.error(
      "LLM_PROVIDER can be set to 'openai' or 'anthropic'. Default is 'openai'."
    );
    process.exit(1);
  }

  return { entryFile, apiKey, llmProvider, methodName };
}

async function analyzeMethodAndDependencies(
  method: { name: string; code: string },
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

async function main() {
  const { entryFile, apiKey, llmProvider, methodName } = parseCliArgs();
  const spinner = ora();
  let userContext = "";

  let llmClient: LLMClient;
  if (llmProvider.toLowerCase() === "anthropic") {
    llmClient = new AnthropicClient(apiKey);
  } else {
    llmClient = new OpenAIClient(apiKey);
  }

  const entryFilePath = path.resolve(entryFile);
  const fileName = entryFilePath.split("/").pop()?.split(".")[0] || "";
  const bundler = new CodeBundler(entryFilePath, methodName);
  const {
    inputFileCode,
    dependenciesCode,
    inputFileImports,
    dependenciesImports,
    methods,
    message,
    isJavaScript,
    exportType,
    classImportStatements,
  } = bundler.bundle();

  if (message) {
    console.log(message);
  }

  const testGenerator = new TestGenerator(llmClient);

  // Filter methods if specific method is requested
  // const methodsToProcess = methodName
  //   ? methods.filter(m => m.name.toLowerCase() === methodName.toLowerCase())
  //   : methods;

  // if (methodName && methodsToProcess.length === 0) {
  //   console.error(`Method "${methodName}" not found in the source file.`);
  //   process.exit(1);
  // }
  const methodsToProcess = methods;

  // Get user input for additional context
  if (process.env.CI !== "true") {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    userContext = await new Promise<string>((resolve) => {
      rl.question(
        "Please provide additional context if any (or press Enter to skip):\n",
        (answer) => {
          rl.close();
          resolve(answer);
        }
      );
    });
  }

  // Process each method separately
  for (const method of methodsToProcess) {
    spinner.start(`Analyzing method: ${method.name}`);

    // Analyze only the specific method and its dependencies
    const analysis = await analyzeMethodAndDependencies(
      method,
      dependenciesCode,
      llmClient
    );

    spinner.succeed(`Analysis complete for ${method.name}`);
    spinner.start(`Generating tests for method: ${method.name}`);

    const result = await testGenerator.generateTestsForMethod(
      method.name,
      method.code,
      dependenciesCode,
      userContext,
      inputFileImports,
      dependenciesImports,
      analysis,
      isJavaScript,
      exportType,
      entryFilePath,
      fileName,
      classImportStatements
    );

    fs.writeFileSync(result.filePath, result.code);
    spinner.succeed(`Tests generated for ${method.name} at ${result.filePath}`);
  }
}

main().catch(console.error);

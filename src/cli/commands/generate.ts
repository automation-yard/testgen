import { Command } from "commander";
import { CodeBundler } from "../../core/bundler";
import { TestGenerator } from "../../core/generator";
import { GenerateCommandOptions } from "../types";
import { AnthropicClient } from "../../llm/anthropic";
import { OpenAIClient } from "../../llm/openai";
import { ConfigLoader } from "../../config/loader";
import { LLMClient } from "../../llm/types";
import { Method } from "../../types/bundler";
import { getFrameworkRules } from "../../prompts/frameworks";
import { buildAnalysisPrompt } from "../../prompts/analysis";
import { writeDebugFile, writeTestFile } from "../../utils/files";
import ora from "ora";
import path from "path";
import fs from "fs";
import * as readline from "readline";

export function createGenerateCommand(): Command {
  const command = new Command("generate")
    .description("Generate tests for a file or specific method")
    .argument("<file>", "File to generate tests for")
    .option("-m, --method <method>", "Specific method to generate tests for")
    .option("-p, --provider <provider>", "LLM provider (anthropic or openai)")
    .option("-k, --api-key <key>", "API key for the LLM provider")
    .action(async (file: string, options: GenerateCommandOptions) => {
      try {
        // Load configuration
        const configLoader = new ConfigLoader();
        const config = await configLoader.loadConfig();

        // Initialize LLM client
        const provider = options.provider || config.llm.provider;
        const apiKey =
          options.apiKey || process.env[`${provider.toUpperCase()}_API_KEY`];
        if (!apiKey) {
          throw new Error(
            `No API key provided for ${provider}. Set ${provider.toUpperCase()}_API_KEY environment variable or use --api-key option.`
          );
        }

        const llmClient = createLLMClient(provider, apiKey);
        const spinner = ora("Bundling code...").start();

        // Bundle the code
        const entryFilePath = path.resolve(file);
        const fileName = path.basename(entryFilePath).split(".")[0];
        const bundler = new CodeBundler(entryFilePath, options.method);
        const bundleResult = await bundler.bundle();

        spinner.succeed("Code bundled successfully");

        if (bundleResult.message) {
          console.log(bundleResult.message);
        }

        // Get user context if not in CI
        const userContext =
          process.env.CI === "true" ? "" : await getUserContext();

        // Generate tests
        const testGenerator = new TestGenerator(llmClient);
        const methodsToProcess = options.method
          ? bundleResult.methods.filter((m: Method) =>
              m.name.toLowerCase().includes(options.method!.toLowerCase())
            )
          : bundleResult.methods;

        if (options.method && methodsToProcess.length === 0) {
          throw new Error(
            `Method "${options.method}" not found in the source file.`
          );
        }

        const frameworkRules = getFrameworkRules(config.framework);

        for (const method of methodsToProcess) {
          spinner.start(`Analyzing method: ${method.name}`);
          const analysisPrompt = buildAnalysisPrompt({
            methodCode: method.code,
            dependenciesCode: bundleResult.dependenciesCode,
            frameworkRules,
          });

          const analysis = await llmClient.generateText(analysisPrompt);

          writeDebugFile(`analysis_${method.name}`, analysis);
          writeDebugFile(`analysis_prompt_${method.name}`, analysisPrompt);

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

          // Write test file
          writeTestFile(result.filePath, result.code);
          spinner.succeed(`Tests generated: ${result.filePath}`);
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

  const questions = [
    {
      text: "Please provide additional context if any (or press Enter to skip):",
      key: "general",
    },
    {
      text: "Are there any specific testing requirements or conventions to follow?",
      key: "testingRequirements",
    },
    {
      text: "Are there any known edge cases or complex scenarios to consider?",
      key: "edgeCases",
    },
  ];

  let context = "";
  for (const question of questions) {
    const answer = await askQuestion(rl, question.text);
    if (answer.trim()) {
      context += `${question.key}: ${answer}\n`;
    }
  }

  rl.close();
  return context;
}

function askQuestion(
  rl: readline.Interface,
  question: string
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${question}\n`, (answer) => {
      resolve(answer);
    });
  });
}

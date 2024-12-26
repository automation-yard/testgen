import { Command } from 'commander';
import { CodeBundler } from '../../core/bundler';
import { TestGenerator } from '../../core/generator';
import { GenerateCommandOptions } from '../types';
import { createTestHealer } from '../../core/test-healer';
import { createCoverageManager } from '../../core/coverage';
import { testRunner } from '../../core/test-runner';
import { ConfigLoader } from '../../config/loader';
import { Method } from '../../types/bundler';
import { getFrameworkRules } from '../../prompts/frameworks';
import { buildAnalysisPrompt } from '../../prompts/analysis';
import { writeDebugFile, writeTestFile } from '../../utils/files';
import { CoverageResult } from '../../core/coverage/types';
import { createLLMClient, LLMProvider } from '../../llm/factory';
import { createTestSetupVerifier } from '../../core/test-setup';
import ora from 'ora';
import path from 'path';
import * as readline from 'readline';

export function createGenerateCommand(): Command {
  const command = new Command('generate')
    .description('Generate tests for a file or specific method')
    .argument('<file>', 'File to generate tests for')
    .option('-m, --method <method>', 'Specific method to generate tests for')
    .option(
      '-p, --provider <provider>',
      'LLM provider (anthropic, openai, or qwen)'
    )
    .option('-k, --api-key <key>', 'API key for the LLM provider')
    .option(
      '-f, --force',
      'Force test generation even if test setup is incomplete'
    )
    .action(async (file: string, options: GenerateCommandOptions) => {
      try {
        // Load configuration
        const configLoader = new ConfigLoader();
        const config = await configLoader.loadConfig();

        // Create and use test setup verifier
        const verifier = createTestSetupVerifier(config);
        const setupResult = await verifier.verify();

        if (!setupResult.isComplete && !options.force) {
          console.error(verifier.getErrorMessage(setupResult));
          console.error(
            '\nUse --force to generate tests anyway, but they may not run correctly.'
          );
          process.exit(1);
        }

        if (!setupResult.isComplete && options.force) {
          console.warn(
            '\nWarning: Test setup is incomplete. Generated tests may not run correctly.'
          );
          console.warn('Missing requirements:');
          if (setupResult.missingConfigFiles.length > 0) {
            console.warn('Configuration files:');
            setupResult.missingConfigFiles.forEach((file) => {
              console.warn(`  - ${file}`);
            });
          }
          if (setupResult.missingDependencies.length > 0) {
            console.warn('Dependencies:');
            setupResult.missingDependencies.forEach((dep) => {
              console.warn(`  - ${dep}`);
            });
          }
          console.warn('\nProceeding with test generation...\n');
        }

        // Get LLM provider and API key
        const provider = (options.provider ||
          config.llm.provider) as LLMProvider;
        let apiKey = options.apiKey;

        if (!apiKey) {
          // Try to get API key from environment variables
          const envVar = `${provider.toUpperCase()}_API_KEY`;
          apiKey = process.env[envVar];

          if (!apiKey) {
            console.error(
              `No API key provided. Please provide it via --api-key option or ${envVar} environment variable`
            );
            process.exit(1);
          }
        }

        const llmClient = createLLMClient(apiKey, config);
        const spinner = ora('Bundling code...').start();

        // Initialize healing and coverage services
        const testHealer = createTestHealer(
          {
            maxRetries: config.healing?.maxRetriesForFix || 3,
            timeoutPerAttempt: config.healing?.timeoutPerAttempt,
            healingStrategy: config.healing?.strategy || 'conservative'
          },
          llmClient,
          config
        );

        const coverageManager = createCoverageManager(llmClient, config);

        // Bundle the code
        const entryFilePath = path.resolve(file);
        const fileName = path.basename(entryFilePath).split('.')[0];
        const bundler = new CodeBundler(entryFilePath, options.method);
        const bundleResult = await bundler.bundle();

        spinner.succeed('Code bundled successfully');

        if (bundleResult.message) {
          console.log(bundleResult.message);
        }

        // Get user context if not in CI
        const userContext =
          process.env.CI === 'true' ? '' : await getUserContext();

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
            frameworkRules
          });

          const analysisResponse = await llmClient.generateText(analysisPrompt);
          const analysis = analysisResponse.content;
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

          // Write initial test file
          const testFile = result.filePath;
          writeTestFile(testFile, result.code);
          writeDebugFile('initial-test-file', result.code);
          spinner.succeed(`Tests generated: ${testFile}`);

          // Run initial test with coverage
          spinner.start('Running tests...');
          const initialTestResult = await testRunner.runTest({
            testFile,
            collectCoverage: true
          });

          // Heal test if there are errors
          if (!initialTestResult.success && initialTestResult.errors) {
            spinner.info('Initial test has errors. Attempting to fix...');
            console.log('Test errors:', initialTestResult.errors);

            const healingResult = await testHealer.healTest({
              originalServiceFile: file,
              generatedTestFile: testFile,
              testRunError: initialTestResult.errors,
              attemptNumber: 1,
              maxRetries: config.healing?.maxRetriesForFix || 3
            });

            if (!healingResult.isFixed) {
              spinner.fail('Could not fix all test errors');
              console.error('Remaining errors:', healingResult.remainingErrors);
              continue;
            }

            spinner.succeed('Successfully fixed test errors');
          }

          // Enhance coverage if needed
          // spinner.start('Checking test coverage...');
          // const coverageResult = await coverageManager.enhanceCoverage({
          //   targetFile: file,
          //   testFile,
          //   currentCoverage: parseCoverageFromResult(initialTestResult),
          //   config: {
          //     minimumCoverage: config.coverage?.minimum || {
          //       statements: 80,
          //       branches: 80,
          //       functions: 80,
          //       lines: 80
          //     },
          //     maxEnhancementAttempts:
          //       config.coverage?.maxEnhancementAttempts || 3
          //   }
          // });

          // if (!coverageResult.isEnhanced) {
          //   spinner.warn('Could not achieve minimum coverage requirements');
          //   console.log('Final coverage:', coverageResult.finalCoverage);
          // } else {
          //   spinner.succeed('Successfully enhanced test coverage');
          //   console.log('Final coverage:', coverageResult.finalCoverage);
          // }
        }
      } catch (error) {
        console.error(
          'Error:',
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });

  return command;
}

async function getUserContext(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const questions = [
    {
      text: 'Please provide additional context if any (or press Enter to skip):',
      key: 'general'
    },
    {
      text: 'Are there any specific testing requirements or conventions to follow?',
      key: 'testingRequirements'
    },
    {
      text: 'Are there any known edge cases or complex scenarios to consider?',
      key: 'edgeCases'
    }
  ];

  let context = '';
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

function parseCoverageFromResult(testResult: any): CoverageResult {
  if (!testResult.coverage) {
    return {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
      uncoveredLines: [],
      uncoveredFunctions: [],
      uncoveredBranches: []
    };
  }

  return {
    statements: testResult.coverage.statements,
    branches: testResult.coverage.branches,
    functions: testResult.coverage.functions,
    lines: testResult.coverage.lines,
    uncoveredLines: testResult.coverage.uncoveredLines || [],
    uncoveredFunctions: testResult.coverage.uncoveredFunctions || [],
    uncoveredBranches: testResult.coverage.uncoveredBranches || []
  };
}

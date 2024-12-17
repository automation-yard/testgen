import fs from 'fs/promises'
import {
  CoverageConfig,
  CoverageEnhancementInput,
  CoverageEnhancementResult,
  CoverageEnhancementAttempt,
  CoverageResult
} from './types'
import { buildCoveragePrompt } from './prompt'
import { testRunner } from '../test-runner'
import { LLMClient } from '../../llm/types'
import { TestGenConfig } from '../../config/schema'

export class CoverageManager {
  constructor(
    private readonly llm: LLMClient,
    private readonly testGenConfig: TestGenConfig
  ) {}

  async enhanceCoverage(input: CoverageEnhancementInput): Promise<CoverageEnhancementResult> {
    const attempts: CoverageEnhancementAttempt[] = []
    let currentTestCode = await fs.readFile(input.testFile, 'utf-8')
    const targetCode = await fs.readFile(input.targetFile, 'utf-8')
    let currentCoverage = input.currentCoverage

    let attemptNumber = 1
    let isEnhanced = this.isCoverageSufficient(currentCoverage, input.config.minimumCoverage)
   
    while (!isEnhanced && attemptNumber <= input.config.maxEnhancementAttempts) {
      // Build enhancement prompt
      const prompt = buildCoveragePrompt({
        targetCode,
        currentTestCode,
        coverage: currentCoverage,
        previousAttempts: attempts.map(a => ({
          testCode: a.testChanges,
          coverage: a.coverage
        }))
      })

      // Get enhanced test from LLM
      const response = await this.llm.generateText(prompt);

      const enhancedTestCode = response.content

      // Apply enhancement
      await fs.writeFile(input.testFile, enhancedTestCode)

      // Run test with coverage
      const testResult = await testRunner.runTest({
        testFile: input.testFile,
        collectCoverage: true
      })

      // Parse coverage from test result
      const newCoverage = this.parseCoverageFromResult(testResult)

      // Record attempt
      const attempt: CoverageEnhancementAttempt = {
        attemptNumber,
        coverage: newCoverage,
        testChanges: enhancedTestCode,
        success: this.isCoverageSufficient(newCoverage, input.config.minimumCoverage)
      }
      attempts.push(attempt)

      // Update state for next iteration
      if (this.isCoverageBetter(newCoverage, currentCoverage)) {
        currentCoverage = newCoverage
        currentTestCode = enhancedTestCode
      }

      isEnhanced = this.isCoverageSufficient(currentCoverage, input.config.minimumCoverage)
      attemptNumber++
    }

    return {
      isEnhanced,
      finalCoverage: currentCoverage,
      enhancedTestFile: currentTestCode,
      attempts
    }
  }

  private isCoverageSufficient(
    coverage: CoverageResult,
    minimum: CoverageConfig['minimumCoverage']
  ): boolean {
    return (
      coverage.statements >= minimum.statements &&
      coverage.branches >= minimum.branches &&
      coverage.functions >= minimum.functions &&
      coverage.lines >= minimum.lines
    )
  }

  private isCoverageBetter(
    newCoverage: CoverageResult,
    currentCoverage: CoverageResult
  ): boolean {
    return (
      newCoverage.statements > currentCoverage.statements ||
      newCoverage.branches > currentCoverage.branches ||
      newCoverage.functions > currentCoverage.functions ||
      newCoverage.lines > currentCoverage.lines
    )
  }

  private parseCoverageFromResult(testResult: any): CoverageResult {
    // This would parse the Jest coverage output
    // For now, returning a mock implementation
    return {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
      uncoveredLines: [],
      uncoveredFunctions: [],
      uncoveredBranches: []
    }
  }
}

// Export a factory function
export function createCoverageManager(
  llm: LLMClient,
  testGenConfig: TestGenConfig
): CoverageManager {
  return new CoverageManager(llm, testGenConfig)
} 
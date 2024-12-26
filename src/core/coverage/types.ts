export interface CoverageResult {
  statements: number
  branches: number
  functions: number
  lines: number
  uncoveredLines: number[]
  uncoveredFunctions: string[]
  uncoveredBranches: string[]
}

export interface CoverageConfig {
  enabled?: boolean
  minimumCoverage: {
    statements: number
    branches: number
    functions: number
    lines: number
  }
  maxEnhancementAttempts: number
}

export interface CoverageEnhancementInput {
  targetFile: string
  testFile: string
  currentCoverage: CoverageResult
  config: CoverageConfig
}

export interface CoverageEnhancementResult {
  isEnhanced: boolean
  finalCoverage: CoverageResult
  enhancedTestFile?: string
  attempts: CoverageEnhancementAttempt[]
}

export interface CoverageEnhancementAttempt {
  attemptNumber: number
  coverage: CoverageResult
  testChanges: string
  success: boolean
} 
import { CoverageResult } from './types'
import fs from 'fs/promises'
import path from 'path'

interface JestCoverageSummary {
  total: {
    statements: { total: number; covered: number; pct: number }
    branches: { total: number; covered: number; pct: number }
    functions: { total: number; covered: number; pct: number }
    lines: { total: number; covered: number; pct: number }
  }
}

interface JestCoverageDetail {
  statementMap: Record<string, { start: { line: number }, end: { line: number } }>
  fnMap: Record<string, { name: string, line: number }>
  branchMap: Record<string, { line: number, type: string }>
  s: Record<string, number>  // statement coverage
  f: Record<string, number>  // function coverage
  b: Record<string, number[]>  // branch coverage
}

export async function parseCoverageResult(coverageDir: string): Promise<CoverageResult> {
  try {
    // Wait for coverage files to be written
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Read coverage summary
    const summaryPath = path.join(coverageDir, 'coverage-summary.json')
    const summary = JSON.parse(await fs.readFile(summaryPath, 'utf-8')) as JestCoverageSummary

    // Get the first coverage file for detailed info
    const coverageFiles = await fs.readdir(coverageDir)
    const detailFile = coverageFiles.find(f => f.endsWith('.json') && !f.includes('summary'))
    if (!detailFile) {
      console.warn('No detailed coverage information found')
      return createEmptyCoverageResult()
    }

    const detailPath = path.join(coverageDir, detailFile)
    const detail = JSON.parse(await fs.readFile(detailPath, 'utf-8')) as JestCoverageDetail

    // Get uncovered lines
    const uncoveredLines = Object.entries(detail.s)
      .filter(([_, covered]) => covered === 0)
      .map(([id]) => detail.statementMap[id].start.line)

    // Get uncovered functions
    const uncoveredFunctions = Object.entries(detail.f)
      .filter(([_, covered]) => covered === 0)
      .map(([id]) => detail.fnMap[id].name)

    // Get uncovered branches
    const uncoveredBranches = Object.entries(detail.b)
      .filter(([_, coverage]) => coverage.some(c => c === 0))
      .map(([id]) => `Line ${detail.branchMap[id].line}: ${detail.branchMap[id].type} branch`)

    return {
      statements: summary.total.statements.pct,
      branches: summary.total.branches.pct,
      functions: summary.total.functions.pct,
      lines: summary.total.lines.pct,
      uncoveredLines: [...new Set(uncoveredLines)].sort((a, b) => a - b),
      uncoveredFunctions,
      uncoveredBranches
    }
  } catch (error) {
    console.warn('Error parsing coverage results:', error)
    return createEmptyCoverageResult()
  }
}

function createEmptyCoverageResult(): CoverageResult {
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
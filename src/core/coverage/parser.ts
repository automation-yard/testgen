import { CoverageResult } from './types'
import fs from 'fs/promises'
import path from 'path'

interface JestCoverageSummary { 
    statements: { total: number; covered: number; pct: number }
    branches: { total: number; covered: number; pct: number }
    functions: { total: number; covered: number; pct: number }
    lines: { total: number; covered: number; pct: number }
}

interface JestCoverageDetail {
  statementMap: Record<string, { start: { line: number }, end: { line: number } }>
  fnMap: Record<string, { name: string, line: number }>
  branchMap: Record<string, { line: number, type: string }>
  s: Record<string, number>  // statement coverage
  f: Record<string, number>  // function coverage
  b: Record<string, number[]>  // branch coverage
}

export async function parseCoverageResult(
  coverageDir: string,
  targetFile?: string
): Promise<CoverageResult> {
  try {
    // Wait for coverage files to be written
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Read both coverage files
    const summaryPath = path.join(coverageDir, 'coverage-summary.json');
    const detailPath = path.join(coverageDir, 'coverage-final.json');
    
    const summaryData = JSON.parse(await fs.readFile(summaryPath, 'utf-8')) as Record<string, JestCoverageSummary>;
    const detailData = JSON.parse(await fs.readFile(detailPath, 'utf-8')) as Record<string, JestCoverageDetail>;

    // If no target file, return empty coverage
    if (!targetFile) {
      return createEmptyCoverageResult();
    }

    // Find the matching file in coverage data
    const normalizedTargetPath = path.normalize(targetFile).replace(/\\/g, '/');
    console.log('Looking for coverage for file:', normalizedTargetPath);

    const targetFilePath = Object.keys(summaryData).find(filePath => {
      const normalizedFilePath = path.normalize(filePath).replace(/\\/g, '/');
      console.log('Checking against:', normalizedFilePath);
      return normalizedFilePath.includes(normalizedTargetPath);
    });

    if (!targetFilePath) {
      console.warn('Available files in coverage:', Object.keys(summaryData));
      console.warn('No coverage data found for target file:', targetFile);
      return createEmptyCoverageResult();
    }

    const coverageSummary = summaryData[targetFilePath];
    const coverageDetail = detailData[targetFilePath];

    // Get uncovered lines from detail data
    const uncoveredLines = Object.entries(coverageDetail.s)
      .filter(([_, count]) => count === 0)
      .map(([id]) => coverageDetail.statementMap[id].start.line);

    // Get uncovered functions from detail data
    const uncoveredFunctions = Object.entries(coverageDetail.f)
      .filter(([_, count]) => count === 0)
      .map(([id]) => coverageDetail.fnMap[id].name);

    // Get uncovered branches from detail data
    const uncoveredBranches = Object.entries(coverageDetail.b)
      .filter(([_, coverage]) => coverage.some(c => c === 0))
      .map(([id]) => `Line ${coverageDetail.branchMap[id].line}: ${coverageDetail.branchMap[id].type} branch`);

    return {
      statements: coverageSummary.statements.pct,
      branches: coverageSummary.branches.pct,
      functions: coverageSummary.functions.pct,
      lines: coverageSummary.lines.pct,
      uncoveredLines: [...new Set(uncoveredLines)].sort((a, b) => a - b),
      uncoveredFunctions,
      uncoveredBranches
    };

  } catch (error) {
    console.warn('Error parsing coverage results:', error);
    return createEmptyCoverageResult();
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
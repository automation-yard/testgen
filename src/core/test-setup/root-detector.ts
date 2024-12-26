import fs from 'fs';
import path from 'path';

/**
 * Detects the project root by looking for common project indicators
 * like package.json, .git, nx.json, etc.
 */
export function detectProjectRoot(): string {
  let currentDir = process.cwd();

  while (currentDir !== '/') {
    // Check for common project root indicators
    const hasPackageJson = fs.existsSync(path.join(currentDir, 'package.json'));
    const hasGit = fs.existsSync(path.join(currentDir, '.git'));
    const hasLerna = fs.existsSync(path.join(currentDir, 'lerna.json'));
    const hasNx = fs.existsSync(path.join(currentDir, 'nx.json'));
    const hasPnpm = fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml'));

    // If package.json exists with any other indicator, we've found the root
    if (hasPackageJson && (hasGit || hasLerna || hasNx || hasPnpm)) {
      return currentDir;
    }

    // Move up one directory
    currentDir = path.dirname(currentDir);
  }

  // If we reach here, use current directory as fallback
  return process.cwd();
}

/**
 * Resolves the appropriate root directory based on config
 */
export function resolveTestRoot(config: {
  isMonoRepo: boolean;
  currentRoot?: string;
}): string {
  if (config.isMonoRepo) {
    if (!config.currentRoot) {
      throw new Error('currentRoot is required for monorepo projects');
    }
    return config.currentRoot;
  }
  return detectProjectRoot();
}

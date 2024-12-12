import fs from 'fs';
import path from 'path';

interface ConfigFinderResult {
  configPath: string | null;
  projectRoot: string | null;
}

const CONFIG_FILES = [
  'jest.config.js',
  'jest.config.ts',
  'jest.config.mjs',
  'jest.config.cjs',
  'jest.config.json'
];

export function findNearestJestConfig(startPath: string): ConfigFinderResult {
  let currentPath = startPath;
  let projectRoot = null;

  // First, find the project root (package.json location)
  while (currentPath !== path.parse(currentPath).root) {
    if (fs.existsSync(path.join(currentPath, 'package.json'))) {
      projectRoot = currentPath;
      break;
    }
    currentPath = path.dirname(currentPath);
  }

  // Reset to start path to look for Jest config
  currentPath = startPath;

  // Look for Jest config starting from the test file location
  while (currentPath !== path.parse(currentPath).root) {
    for (const configFile of CONFIG_FILES) {
      const configPath = path.join(currentPath, configFile);
      if (fs.existsSync(configPath)) {
        return {
          configPath,
          projectRoot
        };
      }
    }

    // Stop at project root if found
    if (currentPath === projectRoot) break;
    currentPath = path.dirname(currentPath);
  }

  return {
    configPath: null,
    projectRoot
  };
}

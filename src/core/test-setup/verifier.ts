import fs from 'fs';
import path from 'path';
import { TestGenConfig } from '../../config/schema';
import { resolveTestRoot, detectProjectRoot } from './root-detector';

interface SetupRequirement {
  name: string;
  type: 'package' | 'file' | 'config';
  path?: string;
  packageName?: string;
}

type DependencyLocation = 'app' | 'project' | 'both' | 'none';
interface DependencyCheckResult {
  hasDependencies: boolean;
  missingDeps: string[];
  foundDeps: string[];
  location?: DependencyLocation;
}

interface VerificationResult {
  isComplete: boolean;
  missingConfigFiles: string[];
  missingDependencies: string[];
  setupPath: string;
  framework: string;
  dependenciesFoundAt?: DependencyLocation;
}

const frameworkRequirements: Record<string, SetupRequirement[]> = {
  react: [
    { name: 'Jest', type: 'package', packageName: 'jest' },
    {
      name: 'Testing Library React',
      type: 'package',
      packageName: '@testing-library/react'
    },
    {
      name: 'Testing Library Jest DOM',
      type: 'package',
      packageName: '@testing-library/jest-dom'
    },
    { name: 'Jest Config', type: 'file', path: 'jest.config.{js,ts}' }
  ],
  express: [
    { name: 'Jest', type: 'package', packageName: 'jest' },
    { name: 'Supertest', type: 'package', packageName: 'supertest' },
    { name: 'Jest Config', type: 'file', path: 'jest.config.{js,ts}' }
  ],
  nestjs: [
    { name: 'Jest', type: 'package', packageName: 'jest' },
    {
      name: '@nestjs/testing',
      type: 'package',
      packageName: '@nestjs/testing'
    },
    { name: 'Jest Config', type: 'file', path: 'jest.config.{js,ts}' }
  ],
  nodejs: [
    { name: 'Jest', type: 'package', packageName: 'jest' },
    { name: '@jest/globals', type: 'package', packageName: '@jest/globals' },
    { name: '@types/jest', type: 'package', packageName: '@types/jest' },
    { name: 'Jest Config', type: 'file', path: 'jest.config.{js,ts}' }
  ]
};

export class TestSetupVerifier {
  private config: TestGenConfig;
  private appRoot: string;
  private projectRoot: string;

  constructor(config: TestGenConfig) {
    this.config = config;
    this.appRoot = config.isMonoRepo
      ? config.currentRoot!
      : detectProjectRoot();
    this.projectRoot = detectProjectRoot();
  }

  /**
   * Verifies if the test setup is complete in the appropriate root directory
   */
  async verify(): Promise<VerificationResult> {
    const missingConfigFiles: string[] = [];
    const framework = this.config.framework;

    // Check all required files in app root
    const fileRequirements = frameworkRequirements[framework].filter(
      (req) => req.type === 'file' || req.type === 'config'
    );

    for (const req of fileRequirements) {
      if (req.path) {
        // Handle glob patterns like jest.config.{js,ts}
        const pattern = req.path.replace('{js,ts}', '*');
        const files = [pattern.replace('*', 'js'), pattern.replace('*', 'ts')];

        // Also check common test setup locations
        if (pattern.includes('setup')) {
          files.push(
            'test/setup.js',
            'test/setup.ts',
            '__tests__/setup.js',
            '__tests__/setup.ts'
          );
        }

        const fileExists = files.some((file) =>
          fs.existsSync(path.join(this.appRoot, file))
        );

        // Check package.json for jest config if looking for jest config
        if (!fileExists && pattern.includes('jest.config')) {
          const pkgPath = path.join(this.appRoot, 'package.json');
          try {
            if (fs.existsSync(pkgPath)) {
              const pkg = require(pkgPath);
              if (pkg.jest) continue; // Skip adding to missing files if found in package.json
            }
          } catch (error) {
            console.error('Error reading package.json:', error);
          }
        }

        if (!fileExists) {
          missingConfigFiles.push(req.path);
        }
      }
    }

    // Check for required dependencies (with fallback)
    const depsResult = await this.verifyDependenciesWithFallback();

    return {
      isComplete: missingConfigFiles.length === 0 && depsResult.hasDependencies,
      missingConfigFiles,
      missingDependencies: depsResult.missingDeps,
      setupPath: this.appRoot,
      framework,
      dependenciesFoundAt: depsResult.location
    };
  }

  /**
   * Verifies dependencies with fallback to project root for monorepo
   */
  private async verifyDependenciesWithFallback(): Promise<DependencyCheckResult> {
    // First check app root
    const appDeps = await this.getDependenciesFromPackageJson(this.appRoot);

    if (this.config.isMonoRepo && !appDeps.hasDependencies) {
      // Fallback to project root for monorepo
      const projectDeps = await this.getDependenciesFromPackageJson(
        this.projectRoot
      );

      // Combine dependencies from both levels
      const allDeps = {
        hasDependencies: appDeps.hasDependencies || projectDeps.hasDependencies,
        missingDeps: projectDeps.missingDeps.filter(
          (dep) => !appDeps.foundDeps.includes(dep)
        ),
        foundDeps: [
          ...new Set([...appDeps.foundDeps, ...projectDeps.foundDeps])
        ],
        location:
          appDeps.foundDeps.length > 0 && projectDeps.foundDeps.length > 0
            ? 'both'
            : appDeps.foundDeps.length > 0
              ? 'app'
              : projectDeps.foundDeps.length > 0
                ? 'project'
                : ('none' as DependencyLocation)
      };

      return allDeps;
    }

    return {
      ...appDeps,
      location: appDeps.hasDependencies ? 'app' : 'none'
    };
  }

  /**
   * Gets dependencies from package.json at specified root
   */
  private async getDependenciesFromPackageJson(
    root: string
  ): Promise<DependencyCheckResult> {
    const pkgPath = path.join(root, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      const requiredDeps = frameworkRequirements[this.config.framework]
        .filter((req) => req.type === 'package')
        .map((req) => req.packageName!);
      return {
        hasDependencies: false,
        missingDeps: requiredDeps,
        foundDeps: []
      };
    }

    try {
      const pkg = require(pkgPath);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };

      const requiredDeps = frameworkRequirements[this.config.framework]
        .filter((req) => req.type === 'package')
        .map((req) => req.packageName!);
      const missingDeps = requiredDeps.filter((dep) => !allDeps[dep]);
      const foundDeps = requiredDeps.filter((dep) => allDeps[dep]);

      return {
        hasDependencies: missingDeps.length === 0,
        missingDeps,
        foundDeps
      };
    } catch (error) {
      console.error(`Error reading package.json at ${root}:`, error);
      const requiredDeps = frameworkRequirements[this.config.framework]
        .filter((req) => req.type === 'package')
        .map((req) => req.packageName!);
      return {
        hasDependencies: false,
        missingDeps: requiredDeps,
        foundDeps: []
      };
    }
  }

  /**
   * Gets a descriptive error message based on verification results
   */
  getErrorMessage(result: VerificationResult): string {
    if (result.isComplete) return 'Test environment is properly configured.';

    let message = `\nTest setup incomplete for ${result.framework}:\n\n`;

    // Config files (only app root)
    if (result.missingConfigFiles.length > 0) {
      message += `1. Missing configuration files in app root (${this.appRoot}):\n`;
      result.missingConfigFiles.forEach((file) => {
        message += `   - ${file}\n`;
      });
      message += '\n';
    }

    // Dependencies (both roots)
    if (result.missingDependencies.length > 0) {
      message += '2. Missing dependencies:\n';
      if (this.config.isMonoRepo) {
        message += `   Dependencies were checked in:\n`;
        message += `   - App root: ${this.appRoot}\n`;
        message += `   - Project root: ${this.projectRoot}\n`;
        if (result.dependenciesFoundAt) {
          message += `   Some dependencies found in: ${result.dependenciesFoundAt}\n`;
        }
        message += '\n';
      }
      message += `   Install the following packages:\n`;
      message += `   npm install --save-dev ${result.missingDependencies.join(' ')}\n\n`;
    }

    message +=
      '\nRun testgen init to automatically set up the test environment.\n';
    return message;
  }
}

// Export a function to create the verifier with config
export function createTestSetupVerifier(
  config: TestGenConfig
): TestSetupVerifier {
  return new TestSetupVerifier(config);
}

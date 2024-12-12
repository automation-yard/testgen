import fs from 'fs';
import path from 'path';
import { TestGenConfig } from '../../config/schema';

interface SetupRequirement {
  name: string;
  type: 'package' | 'file' | 'config';
  path?: string;
  packageName?: string;
}

interface SetupVerificationResult {
  isReady: boolean;
  missingRequirements: SetupRequirement[];
  framework: string;
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
    { name: 'Jest Config', type: 'file', path: 'jest.config.js' },
    { name: 'Jest Setup', type: 'file', path: 'jest.setup.js' }
  ],
  express: [
    { name: 'Jest', type: 'package', packageName: 'jest' },
    { name: 'Supertest', type: 'package', packageName: 'supertest' },
    { name: 'Jest Config', type: 'file', path: 'jest.config.js' }
  ],
  nestjs: [
    { name: 'Jest', type: 'package', packageName: 'jest' },
    {
      name: '@nestjs/testing',
      type: 'package',
      packageName: '@nestjs/testing'
    },
    { name: 'Jest Config', type: 'file', path: 'jest.config.js' }
  ]
};

export class TestSetupVerifier {
  constructor(private readonly projectRoot: string) {}

  async verifySetup(config: TestGenConfig): Promise<SetupVerificationResult> {
    const framework = config.framework;
    const requirements = frameworkRequirements[framework] || [];
    const missingRequirements: SetupRequirement[] = [];

    // Check each requirement
    for (const req of requirements) {
      if (req.type === 'package') {
        if (!this.isPackageInstalled(req.packageName!)) {
          missingRequirements.push(req);
        }
      } else if (req.type === 'file') {
        if (!this.doesFileExist(req.path!)) {
          missingRequirements.push(req);
        }
      }
    }

    return {
      isReady: missingRequirements.length === 0,
      missingRequirements,
      framework
    };
  }

  private isPackageInstalled(packageName: string): boolean {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      return (
        (packageJson.dependencies && packageJson.dependencies[packageName]) ||
        (packageJson.devDependencies &&
          packageJson.devDependencies[packageName])
      );
    } catch {
      return false;
    }
  }

  private doesFileExist(filePath: string): boolean {
    return fs.existsSync(path.join(this.projectRoot, filePath));
  }

  getSetupInstructions(result: SetupVerificationResult): string {
    if (result.isReady) {
      return 'Test environment is properly configured.';
    }

    const packageInstalls = result.missingRequirements
      .filter((req) => req.type === 'package')
      .map((req) => req.packageName);

    const missingFiles = result.missingRequirements
      .filter((req) => req.type === 'file')
      .map((req) => req.path);

    let instructions = `\nTest setup is incomplete for ${result.framework}. Please set up the following:\n\n`;

    if (packageInstalls.length > 0) {
      instructions += '1. Install required packages:\n';
      instructions += `   npm install --save-dev ${packageInstalls.join(' ')}\n\n`;
    }

    if (missingFiles.length > 0) {
      instructions += '2. Create required configuration files:\n';
      missingFiles.forEach((file) => {
        instructions += `   - ${file}\n`;
      });
      instructions += '\nOr run:\n';
      instructions += '   testgen init\n';
      instructions += 'to automatically set up the test environment.\n';
    }

    return instructions;
  }
}

export const testSetupVerifier = new TestSetupVerifier(process.cwd());

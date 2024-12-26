import fs from 'fs';
import path from 'path';
import { TestSetupVerifier } from '../verifier';
import { resolveTestRoot, detectProjectRoot } from '../root-detector';

jest.mock('fs');
jest.mock('../root-detector');

describe('TestSetupVerifier', () => {
  const mockExistsSync = fs.existsSync as jest.Mock;
  const mockResolveTestRoot = resolveTestRoot as jest.Mock;
  const mockDetectProjectRoot = detectProjectRoot as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveTestRoot.mockReturnValue('/test/project');
    mockDetectProjectRoot.mockReturnValue('/test/project');
  });

  describe('verify', () => {
    it('should return complete when all requirements are met in app root', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return (
          path.endsWith('jest.config.js') ||
          path.endsWith('jest.setup.js') ||
          path.endsWith('package.json')
        );
      });

      // Mock package.json content with React-specific dependencies
      jest.mock(
        '/test/project/package.json',
        () => ({
          dependencies: {
            jest: '^29.0.0',
            '@testing-library/react': '^14.0.0'
          },
          devDependencies: {
            '@types/jest': '^29.0.0',
            'ts-jest': '^29.0.0',
            '@testing-library/jest-dom': '^6.0.0'
          }
        }),
        { virtual: true }
      );

      const verifier = new TestSetupVerifier({
        isMonoRepo: false,
        language: 'typescript',
        framework: 'react',
        testFilePattern: '${filename}.test.${ext}',
        llm: {
          provider: 'anthropic',
          temperature: 0.7,
          maxTokens: 4096
        }
      });

      const result = await verifier.verify();
      expect(result.isComplete).toBe(true);
      expect(result.missingConfigFiles).toHaveLength(0);
      expect(result.missingDependencies).toHaveLength(0);
      expect(result.setupPath).toBe('/test/project');
      expect(result.framework).toBe('react');
      expect(result.dependenciesFoundAt).toBe('app');
    });

    it('should handle monorepo with dependencies in project root', async () => {
      mockDetectProjectRoot.mockReturnValue('/test/project');
      mockExistsSync.mockImplementation((path: string) => {
        if (path.endsWith('jest.config.js') || path.endsWith('jest.setup.js')) {
          // Config files exist in app root
          return path.includes('/test/project/packages/app/');
        }
        // package.json exists in both roots
        return path.endsWith('package.json');
      });

      // Mock app package.json without deps
      jest.mock(
        '/test/project/packages/app/package.json',
        () => ({
          dependencies: {},
          devDependencies: {}
        }),
        { virtual: true }
      );

      // Mock project package.json with NestJS deps
      jest.mock(
        '/test/project/package.json',
        () => ({
          dependencies: {
            jest: '^29.0.0',
            '@nestjs/testing': '^10.0.0'
          },
          devDependencies: {
            '@types/jest': '^29.0.0',
            'ts-jest': '^29.0.0'
          }
        }),
        { virtual: true }
      );

      const verifier = new TestSetupVerifier({
        isMonoRepo: true,
        currentRoot: '/test/project/packages/app',
        language: 'typescript',
        framework: 'nestjs',
        testFilePattern: '${filename}.test.${ext}',
        llm: {
          provider: 'anthropic',
          temperature: 0.7,
          maxTokens: 4096
        }
      });

      const result = await verifier.verify();
      expect(result.isComplete).toBe(true);
      expect(result.missingConfigFiles).toHaveLength(0);
      expect(result.missingDependencies).toHaveLength(0);
      expect(result.setupPath).toBe('/test/project/packages/app');
      expect(result.framework).toBe('nestjs');
      expect(result.dependenciesFoundAt).toBe('project');
    });

    it('should handle monorepo with dependencies split between roots', async () => {
      mockDetectProjectRoot.mockReturnValue('/test/project');
      mockExistsSync.mockImplementation((path: string) => {
        if (path.endsWith('jest.config.js') || path.endsWith('jest.setup.js')) {
          return path.includes('/test/project/packages/app/');
        }
        return path.endsWith('package.json');
      });

      // Mock app package.json with some Express deps
      jest.mock(
        '/test/project/packages/app/package.json',
        () => ({
          dependencies: {
            jest: '^29.0.0',
            supertest: '^6.0.0'
          },
          devDependencies: {}
        }),
        { virtual: true }
      );

      // Mock project package.json with other deps
      jest.mock(
        '/test/project/package.json',
        () => ({
          dependencies: {},
          devDependencies: {
            '@types/jest': '^29.0.0',
            'ts-jest': '^29.0.0'
          }
        }),
        { virtual: true }
      );

      const verifier = new TestSetupVerifier({
        isMonoRepo: true,
        currentRoot: '/test/project/packages/app',
        language: 'typescript',
        framework: 'express',
        testFilePattern: '${filename}.test.${ext}',
        llm: {
          provider: 'anthropic',
          temperature: 0.7,
          maxTokens: 4096
        }
      });

      const result = await verifier.verify();
      expect(result.isComplete).toBe(true);
      expect(result.missingConfigFiles).toHaveLength(0);
      expect(result.missingDependencies).toHaveLength(0);
      expect(result.setupPath).toBe('/test/project/packages/app');
      expect(result.framework).toBe('express');
      expect(result.dependenciesFoundAt).toBe('both');
    });

    it('should handle monorepo with no dependencies in either root', async () => {
      mockDetectProjectRoot.mockReturnValue('/test/project');
      mockExistsSync.mockImplementation((path: string) => {
        if (path.endsWith('jest.config.js') || path.endsWith('jest.setup.js')) {
          return path.includes('/test/project/packages/app/');
        }
        return path.endsWith('package.json');
      });

      // Mock app package.json without deps
      jest.mock(
        '/test/project/packages/app/package.json',
        () => ({
          dependencies: {},
          devDependencies: {}
        }),
        { virtual: true }
      );

      // Mock project package.json without deps
      jest.mock(
        '/test/project/package.json',
        () => ({
          dependencies: {},
          devDependencies: {}
        }),
        { virtual: true }
      );

      const verifier = new TestSetupVerifier({
        isMonoRepo: true,
        currentRoot: '/test/project/packages/app',
        language: 'typescript',
        framework: 'react',
        testFilePattern: '${filename}.test.${ext}',
        llm: {
          provider: 'anthropic',
          temperature: 0.7,
          maxTokens: 4096
        }
      });

      const result = await verifier.verify();
      expect(result.isComplete).toBe(false);
      expect(result.missingConfigFiles).toHaveLength(0);
      expect(result.missingDependencies).toContain('@testing-library/react');
      expect(result.missingDependencies).toContain('@testing-library/jest-dom');
      expect(result.setupPath).toBe('/test/project/packages/app');
      expect(result.framework).toBe('react');
      expect(result.dependenciesFoundAt).toBe('none');

      const errorMessage = verifier.getErrorMessage(result);
      expect(errorMessage).toContain('Dependencies were checked in:');
      expect(errorMessage).toContain('App root: /test/project/packages/app');
      expect(errorMessage).toContain('Project root: /test/project');
      expect(errorMessage).toContain('npm install --save-dev');
      expect(errorMessage).toContain('@testing-library/react');
      expect(errorMessage).toContain('@testing-library/jest-dom');
    });
  });
});

import fs from 'fs';
import path from 'path';
import { detectProjectRoot, resolveTestRoot } from '../root-detector';

jest.mock('fs');
jest.mock('process', () => ({
  cwd: jest.fn()
}));

describe('Root Detector', () => {
  const mockCwd = process.cwd as jest.Mock;
  const mockExistsSync = fs.existsSync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCwd.mockReturnValue('/test/project');
  });

  describe('detectProjectRoot', () => {
    it('should detect root with package.json and .git', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.endsWith('package.json') || path.endsWith('.git');
      });

      expect(detectProjectRoot()).toBe('/test/project');
    });

    it('should detect root with package.json and nx.json', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.endsWith('package.json') || path.endsWith('nx.json');
      });

      expect(detectProjectRoot()).toBe('/test/project');
    });

    it('should detect root with package.json and lerna.json', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.endsWith('package.json') || path.endsWith('lerna.json');
      });

      expect(detectProjectRoot()).toBe('/test/project');
    });

    it('should detect root with package.json and pnpm-workspace.yaml', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return (
          path.endsWith('package.json') || path.endsWith('pnpm-workspace.yaml')
        );
      });

      expect(detectProjectRoot()).toBe('/test/project');
    });

    it('should return cwd if no root indicators found', () => {
      mockExistsSync.mockReturnValue(false);
      expect(detectProjectRoot()).toBe('/test/project');
    });

    it('should traverse up directories until root found', () => {
      mockCwd.mockReturnValue('/test/project/packages/app');
      mockExistsSync.mockImplementation((path: string) => {
        return (
          path === '/test/project/package.json' || path === '/test/project/.git'
        );
      });

      expect(detectProjectRoot()).toBe('/test/project');
    });
  });

  describe('resolveTestRoot', () => {
    it('should return currentRoot for monorepo', () => {
      const config = {
        isMonoRepo: true,
        currentRoot: '/test/project/packages/app'
      };

      expect(resolveTestRoot(config)).toBe('/test/project/packages/app');
    });

    it('should throw error if currentRoot missing in monorepo', () => {
      const config = {
        isMonoRepo: true
      };

      expect(() => resolveTestRoot(config)).toThrow('currentRoot is required');
    });

    it('should return detected root for non-monorepo', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.endsWith('package.json') || path.endsWith('.git');
      });

      const config = {
        isMonoRepo: false
      };

      expect(resolveTestRoot(config)).toBe('/test/project');
    });
  });
});

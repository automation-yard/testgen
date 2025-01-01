import { TestRunner } from '..';
import { TestErrorType, TestResultStatus } from '../types';
import path from 'path';
import fs from 'fs';

describe('TestRunner', () => {
  const testRunner = new TestRunner(process.cwd());
  const fixturesPath = path.join(__dirname, 'fixtures');
  const tempPath = path.join(__dirname, 'temp');

  beforeAll(() => {
    // Ensure fixtures and temp directories exist
    fs.mkdirSync(fixturesPath, { recursive: true });
    fs.mkdirSync(tempPath, { recursive: true });
  });

  beforeEach(() => {
    // Clean temp directory before each test
    if (fs.existsSync(tempPath)) {
      const files = fs.readdirSync(tempPath);
      for (const file of files) {
        const filePath = path.join(tempPath, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    }
  });

  describe('Basic Test Execution', () => {
    test('should detect syntax errors', async () => {
      const testFile = path.join(tempPath, 'syntax-error.test.ts');
      fs.writeFileSync(
        testFile,
        `
        describe('broken test', () => {
          it('has syntax error', () => {
            const x = {
          }
        })
      `
      );

      const result = await testRunner.runTest({ testFile });

      expect(result.success).toBe(false);
      expect(result.status).toBe(TestResultStatus.EXECUTION_ERROR);
      expect(result.errors?.[0].type).toBe(TestErrorType.SYNTAX);
      expect(result.testStats).toEqual({
        total: 0,
        failed: 0,
        passed: 0,
        skipped: 0
      });
    });

    test('should detect dependency errors', async () => {
      const testFile = path.join(tempPath, 'dependency-error.test.ts');
      fs.writeFileSync(
        testFile,
        `
        describe('missing dependency', () => {
          it('imports non-existent module', () => {
            const { something } = require('./non-existent-module')
          })
        })
      `
      );

      const result = await testRunner.runTest({ testFile });

      expect(result.success).toBe(false);
      expect(result.errors?.[0].type).toBe(TestErrorType.DEPENDENCY);
    });

    test('should handle failing tests', async () => {
      const testFile = path.join(tempPath, 'failing.test.ts');
      fs.writeFileSync(
        testFile,
        `
        describe('failing test', () => {
          it('fails assertion', () => {
            expect(1).toBe(2)
          })
        })
      `
      );

      const result = await testRunner.runTest({ testFile });

      expect(result.success).toBe(false);
      expect(result.status).toBe(TestResultStatus.TEST_FAILURES);
      expect(result.testStats).toEqual({
        total: 1,
        failed: 1,
        passed: 0,
        skipped: 0
      });
    });

    test('should handle successful tests', async () => {
      const testFile = path.join(tempPath, 'success.test.ts');
      fs.writeFileSync(
        testFile,
        `
        describe('passing test', () => {
          it('passes', () => {
            expect(1).toBe(1)
          })
        })
      `
      );

      const result = await testRunner.runTest({ testFile });

      expect(result.success).toBe(true);
      expect(result.status).toBe(TestResultStatus.SUCCESS);
      expect(result.errors).toBeUndefined();
      expect(result.testStats).toEqual({
        total: 1,
        failed: 0,
        passed: 1,
        skipped: 0
      });
    });
  });

  describe('Configuration Handling', () => {
    test('should use existing Jest config if found', async () => {
      // Create a mock project structure
      const projectDir = path.join(tempPath, 'mock-project');
      fs.mkdirSync(projectDir, { recursive: true });

      // Create package.json
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'mock-project' })
      );

      // Create Jest config
      fs.writeFileSync(
        path.join(projectDir, 'jest.config.js'),
        `module.exports = { testEnvironment: 'node' }`
      );

      // Create test file
      const testFile = path.join(projectDir, 'example.test.ts');
      fs.writeFileSync(
        testFile,
        `
        describe('example', () => {
          it('works', () => {
            expect(true).toBe(true)
          })
        })
      `
      );

      const result = await testRunner.runTest({ testFile });
      expect(result.success).toBe(true);
    });

    test('should handle coverage collection', async () => {
      const testFile = path.join(tempPath, 'coverage.test.ts');
      fs.writeFileSync(
        testFile,
        `
        describe('coverage test', () => {
          function add(a: number, b: number) {
            return a + b;
          }

          it('adds numbers', () => {
            expect(add(1, 2)).toBe(3);
          });
        });
        `
      );

      const result = await testRunner.runTest({
        testFile,
        collectCoverage: true
      });

      expect(result.success).toBe(true);
      expect(result.coverage).toBeDefined();
      expect(result.coverage?.statements).toBeGreaterThan(0);
      expect(result.coverage?.functions).toBeGreaterThan(0);
      expect(result.coverage?.lines).toBeGreaterThan(0);
    });

    test('should handle coverage collection for specific file', async () => {
      // Create source file
      const sourceFile = path.join(tempPath, 'example.ts');
      fs.writeFileSync(
        sourceFile,
        `
        export function add(a: number, b: number) {
          return a + b;
        }

        export function subtract(a: number, b: number) {
          return a - b;
        }
        `
      );

      // Create test file
      const testFile = path.join(tempPath, 'example.test.ts');
      fs.writeFileSync(
        testFile,
        `
        import { add } from './example';

        describe('example', () => {
          it('adds numbers', () => {
            expect(add(1, 2)).toBe(3);
          });
        });
        `
      );

      const result = await testRunner.runTest({
        testFile,
        collectCoverage: true
      });

      expect(result.success).toBe(true);
      expect(result.coverage).toBeDefined();
      expect(result.coverage?.statements).toBe(50); // Only add function is covered
      expect(result.coverage?.functions).toBe(50);
      expect(result.coverage?.uncoveredFunctions).toContain('subtract');
    });
  });

  describe('Environment Handling', () => {
    test('should run Node.js tests with node environment', async () => {
      const testFile = path.join(tempPath, 'node-test.test.ts');
      fs.writeFileSync(
        testFile,
        `
        describe('Node Test', () => {
          it('has process object', () => {
            expect(process).toBeDefined()
            expect(process.env).toBeDefined()
          })
        })
      `
      );

      const result = await testRunner.runTest({
        testFile,
        framework: 'express'
      });

      expect(result.success).toBe(true);
    });

    test('should run React tests with jsdom environment', async () => {
      // Create a simple React component file
      const componentFile = path.join(tempPath, 'Button.tsx');
      fs.writeFileSync(
        componentFile,
        `
        import React from 'react';
        
        interface ButtonProps {
          onClick?: () => void;
          children: React.ReactNode;
        }
        
        export function Button({ onClick, children }: ButtonProps) {
          return (
            <button onClick={onClick} data-testid="test-button">
              {children}
            </button>
          );
        }
        `
      );

      // Create the test file
      const testFile = path.join(tempPath, 'Button.test.tsx');
      fs.writeFileSync(
        testFile,
        `
        import React from 'react';
        import { render, screen, fireEvent } from '@testing-library/react';
        import { Button } from './Button';
        
        describe('Button Component', () => {
          it('renders with correct text', () => {
            render(<Button>Click me</Button>);
            expect(screen.getByTestId('test-button')).toHaveTextContent('Click me');
          });

          it('handles click events', () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick}>Click me</Button>);
            
            fireEvent.click(screen.getByTestId('test-button'));
            expect(handleClick).toHaveBeenCalledTimes(1);
          });

          it('has access to window and document', () => {
            expect(window).toBeDefined();
            expect(document).toBeDefined();
            expect(document.createElement).toBeDefined();
          });
        });
        `
      );

      const result = await testRunner.runTest({
        testFile,
        framework: 'react',
        env: {
          NODE_ENV: 'test',
          JEST_ENVIRONMENT: 'jsdom'
        }
      });

      // Log errors if test fails
      if (!result.success) {
        console.log('React test failed with errors:', result.errors);
        console.log('Raw output:', result.rawOutput);
      }

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });

  afterAll(() => {
    // Cleanup
    fs.rmSync(fixturesPath, { recursive: true, force: true });
    fs.rmSync(tempPath, { recursive: true, force: true });
  });
});

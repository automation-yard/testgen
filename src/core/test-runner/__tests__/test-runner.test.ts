import { TestRunner } from '..';
import { TestErrorType } from '../types';
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
      expect(result.errors?.[0].type).toBe(TestErrorType.SYNTAX);
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
      expect(result.errors).toBeUndefined();
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

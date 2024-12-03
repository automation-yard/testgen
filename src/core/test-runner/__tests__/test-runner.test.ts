import { TestRunner } from '..';
import { TestErrorType } from '../types';
import path from 'path';

describe('TestRunner', () => {
  const testRunner = new TestRunner(process.cwd());
  const fixturesPath = path.join(__dirname, 'fixtures');

  beforeAll(() => {
    // Ensure fixtures directory exists
    require('fs').mkdirSync(fixturesPath, { recursive: true });
  });

  test('should detect syntax errors', async () => {
    const testFile = path.join(fixturesPath, 'syntax-error.test.ts');
    require('fs').writeFileSync(
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
    const testFile = path.join(fixturesPath, 'dependency-error.test.ts');
    require('fs').writeFileSync(
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

  test('should detect assertion failures', async () => {
    const testFile = path.join(fixturesPath, 'assertion-error.test.ts');
    require('fs').writeFileSync(
      testFile,
      `
      describe('failing assertions', () => {
        it('fails assertion', () => {
          expect(1).toBe(2)
        })
      })
    `
    );

    const result = await testRunner.runTest({ testFile });

    expect(result.success).toBe(false);
    expect(result.errors?.[0].type).toBe(TestErrorType.ASSERTION);
  });

  test('should handle successful tests', async () => {
    const testFile = path.join(fixturesPath, 'success.test.ts');
    require('fs').writeFileSync(
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

  afterAll(() => {
    // Clean up fixtures
    require('fs').rmSync(fixturesPath, { recursive: true, force: true });
  });
});

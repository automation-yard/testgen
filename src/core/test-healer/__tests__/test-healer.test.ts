import fs from 'fs/promises';
import path from 'path';
import { TestHealer } from '..';
import { TestErrorType } from '../../test-runner/types';
import { defaultConfig } from '../../../config/schema';

describe('TestHealer', () => {
  const testDir = path.join(__dirname, 'temp');
  const mockLLM = {
    generateText: jest.fn(),
    complete: jest.fn()
  };

  const config = {
    maxRetries: 3,
    timeoutPerAttempt: 30000,
    healingStrategy: 'conservative' as const
  };

  const healer = new TestHealer(config, mockLLM, defaultConfig);

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('should fix dependency errors', async () => {
    const serviceFile = path.join(testDir, 'service.ts');
    const testFile = path.join(testDir, 'service.test.ts');

    // Create test files
    await fs.writeFile(
      serviceFile,
      `
      export class TestService {
        constructor(private readonly dep: any) {}
        async doSomething() {
          return this.dep.call()
        }
      }
    `
    );

    await fs.writeFile(
      testFile,
      `
      describe('TestService', () => {
        it('should do something', async () => {
          const service = new TestService()
          await service.doSomething()
        })
      })
    `
    );

    // Mock LLM to provide a fix
    mockLLM.generateText.mockResolvedValueOnce({
      content: `
      import { TestService } from './service'
      
      describe('TestService', () => {
        it('should do something', async () => {
          const mockDep = { call: jest.fn() }
          const service = new TestService(mockDep)
          await service.doSomething()
          expect(mockDep.call).toHaveBeenCalled()
        })
      })
    `
    });

    const result = await healer.healTest({
      originalServiceFile: serviceFile,
      generatedTestFile: testFile,
      testRunError: [
        {
          type: TestErrorType.DEPENDENCY,
          message: 'Cannot read property call of undefined',
          location: { line: 4, column: 1, file: testFile }
        }
      ],
      attemptNumber: 1,
      maxRetries: 3
    });

    expect(result.isFixed).toBe(true);
    expect(mockLLM.generateText).toHaveBeenCalledTimes(1);
    expect(result.healingAttempts).toHaveLength(1);
    expect(result.healingAttempts[0].success).toBe(true);
  });

  test('should handle multiple fix attempts', async () => {
    const serviceFile = path.join(testDir, 'service2.ts');
    const testFile = path.join(testDir, 'service2.test.ts');

    // Create test files
    await fs.writeFile(
      serviceFile,
      `
      export class TestService {
        async process(data: string) {
          if (!data) throw new Error('No data')
          return data.toUpperCase()
        }
      }
    `
    );

    await fs.writeFile(
      testFile,
      `
      describe('TestService', () => {
        it('should process data', async () => {
          const service = new TestService()
          const result = service.process()
          expect(result).toBe('TEST')
        })
      })
    `
    );

    // Mock LLM to provide fixes
    mockLLM.generateText
      .mockResolvedValueOnce('invalid fix')
      .mockResolvedValueOnce({
        content: `
        import { TestService } from './service2'
        
        describe('TestService', () => {
          it('should process data', async () => {
            const service = new TestService()
            const result = await service.process('test')
            expect(result).toBe('TEST')
          })
        })
      `
      });

    const result = await healer.healTest({
      originalServiceFile: serviceFile,
      generatedTestFile: testFile,
      testRunError: [
        {
          type: TestErrorType.RUNTIME,
          message: 'data is undefined',
          location: { line: 4, column: 1, file: testFile }
        }
      ],
      attemptNumber: 1,
      maxRetries: 3
    });

    expect(result.isFixed).toBe(true);
    expect(mockLLM.generateText).toHaveBeenCalledTimes(2);
    expect(result.healingAttempts).toHaveLength(2);
    expect(result.healingAttempts[0].success).toBe(false);
    expect(result.healingAttempts[1].success).toBe(true);
  });
});

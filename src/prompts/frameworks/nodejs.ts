import { FrameworkRules } from './types';

export const nodejsRules: FrameworkRules = {
  name: 'Node.js',

  testingModuleSetup: `
- Import framework prerequisites and polyfills first (e.g., reflect-metadata for DI)
- Import runtime dependencies required by framework features
- Setup framework-level dependencies and configurations
- Import feature-specific modules and dependencies
- Setup test environment variables with proper backup/restore
- Mock external dependencies (both simple and chained methods)
- Initialize test data and fixtures with type safety
- Clear mocks before each test and restore after
- Handle both simple and complex initialization patterns`,

  mockingPatterns: [
    // Framework Prerequisites
    'Handle framework prerequisites and polyfills before any decorators or DI',
    'Import all required runtime dependencies before framework-specific imports',
    'Setup global dependencies required by decorators or framework features',
    // General Patterns
    'Use jest.mock() for module mocking',
    'Create manual mocks in __mocks__ directory',
    'Use jest.spyOn() for function spying',
    'Mock file system operations',
    'Mock network requests',
    'Mock timers and dates',
    // Chain-specific Patterns
    'Create explicit mock chains for chained methods',
    'Separate mock instance creation from mock function setup',
    'Use type-safe mock return values with proper Promises',
    'Handle constructor initialization separately from method calls',
    'Mock environment variables with proper backup/restore',
    'Create reusable mock instances for complex chains',
    'Handle async operations with proper Promise chains',
    'Clean up mocks and spies after each test'
  ],

  testFileNaming: '[name].test.js',

  testStructure: [
    '// Framework prerequisites',
    'import \'reflect-metadata\';  // Required by DI decorators. Import only if needed',
    'import \'other-polyfill\';    // Required by framework features',
    '',
    "describe('[ModuleName]', () => {",
    '  let instance;',
    '  let mockDependencies;',
    '  let mockExternalService;',
    '  let mockChainedMethod;',
    '  let originalEnv;',
    '',
    '  // Example of simple mock',
    '  jest.mock(\'simple-service\', () => ({',
    '    SimpleService: jest.fn().mockImplementation(() => ({',
    '      method: jest.fn().mockResolvedValue(\'result\')',
    '    }))',
    '  }));',
    '',
    '  // Example of chained mock',
    '  jest.mock(\'chained-service\', () => {',
    '    const mockFinalMethod = jest.fn().mockResolvedValue(\'result\');',
    '    const mockInstance = {',
    '      chainedMethod: mockFinalMethod',
    '    };',
    '    const mockService = jest.fn().mockReturnValue(mockInstance);',
    '    return { ChainedService: mockService };',
    '  });',
    '',
    '  beforeEach(() => {',
    '    // Setup framework prerequisites',
    '    setupFrameworkDependencies();',
    '',
    '    // Setup environment',
    '    originalEnv = process.env;',
    '    process.env = { ...originalEnv };',
    '    jest.clearAllMocks();',
    '',
    '    // Setup simple mocks',
    '    const { SimpleService } = jest.requireMock(\'simple-service\');',
    '    mockDependencies = SimpleService;',
    '',
    '    // Setup chained mocks',
    '    const { ChainedService } = jest.requireMock(\'chained-service\');',
    '    mockExternalService = ChainedService;',
    '    mockChainedMethod = mockExternalService().chainedMethod;',
    '',
    '    // Create instance after all mocks are setup',
    '    instance = new Service();',
    '  });',
    '',
    '  afterEach(() => {',
    '    process.env = originalEnv;',
    '    jest.clearAllMocks();',
    '  });',
    '',
    "  describe('[methodName]', () => {",
    '    it(\'handles simple success case\', async () => {',
    '      // Arrange',
    '      const mockData = { id: \'123\' };',
    '      mockDependencies().method.mockResolvedValue(mockData);',
    '',
    '      // Act',
    '      const result = await instance.method();',
    '',
    '      // Assert',
    '      expect(mockDependencies).toHaveBeenCalledTimes(1);',
    '      expect(result).toEqual(mockData);',
    '    });',
    '',
    '    it(\'handles chained method success case\', async () => {',
    '      // Arrange - Setup type-safe mocks',
    '      const mockData = { id: expect.any(String) };',
    '      mockChainedMethod.mockResolvedValue(mockData);',
    '',
    '      // Act',
    '      const result = await instance.chainedMethod();',
    '',
    '      // Assert - Verify all mock interactions',
    '      expect(mockExternalService).toHaveBeenCalledTimes(1);',
    '      expect(mockChainedMethod).toHaveBeenCalledWith(',
    '        expect.objectContaining(mockData)',
    '      );',
    '      expect(result).toEqual(mockData);',
    '    });',
    '',
    '    it(\'handles error case\', async () => {',
    '      // Arrange - Setup error scenario',
    '      const error = new Error(\'Test error\');',
    '      mockChainedMethod.mockRejectedValue(error);',
    '      const consoleSpy = jest.spyOn(console, \'error\')',
    '        .mockImplementation(() => undefined);',
    '',
    '      // Act',
    '      const result = await instance.chainedMethod();',
    '',
    '      // Assert - Verify error handling',
    '      expect(result).toBeUndefined();',
    '      expect(consoleSpy).toHaveBeenCalledWith(',
    '        expect.stringContaining(\'Test error\')',
    '      );',
    '      consoleSpy.mockRestore();',
    '    });',
    '  });',
    '});'
  ],

  edgeCases: [
    // General Edge Cases
    'Test error handling',
    'Test edge cases and boundary values',
    'Test async operations',
    'Test file system operations',
    'Test network failures',
    'Test resource cleanup',
    'Test environment variable handling',
    'Test invalid input data',
    'Test timeout scenarios',
    // Chain-specific Edge Cases
    'Test constructor initialization vs method calls',
    'Test chained method error propagation',
    'Test type mismatches in responses',
    'Test partial mock chain failures',
    'Test cleanup after chain breaks',
    'Test multiple instance creation',
    'Test concurrent method calls'
  ],

  bestPractices: [
    // Framework Setup Best Practices
    'Import framework prerequisites before any framework features',
    'Handle all decorator dependencies at the top of the file',
    'Ensure runtime dependencies are loaded before framework initialization',
    // General Best Practices
    'Follow AAA pattern (Arrange-Act-Assert)',
    'Mock external dependencies',
    'Use descriptive test names',
    'Test both success and failure cases',
    'Clean up resources after tests',
    'Avoid test interdependence',
    'Mock time-dependent operations',
    'Use appropriate matchers',
    // Chain-specific Best Practices
    'Create explicit mock chains for clarity',
    'Separate mock setup from service creation',
    'Use type-safe mock returns',
    'Handle constructor vs method initialization',
    'Properly manage environment state',
    'Clean up all mock chains',
    'Verify all chain interactions',
    'Mock console methods safely',
    'Restore all spies after use'
  ],

  mockStructurePatterns: {
    // Framework Setup Pattern
    frameworkSetup: `
// Framework prerequisites
import 'reflect-metadata';     // Required by DI decorators
import 'other-polyfill';      // Required by framework features
import { Framework } from 'framework';

// Now safe to use framework features
@decorator()
class TestClass {}`,

    // Simple Mock Pattern
    simpleMock: `
Create simple mocks for basic services:

jest.mock('service', () => ({
  Service: jest.fn().mockImplementation(() => ({
    method: jest.fn().mockResolvedValue('result')
  }))
}));`,

    // Chained Mock Pattern
    chainedMethods: `
Create explicit mock chains for complex services:

jest.mock('service', () => {
  const mockFinalMethod = jest.fn().mockResolvedValue('result');
  const mockInstance = {
    chainedMethod: mockFinalMethod
  };
  const mockService = jest.fn().mockReturnValue(mockInstance);
  
  return {
    ServiceClass: mockService
  };
});`,

    mockSetup: `
Proper mock initialization order:

beforeEach(() => {
  // Setup framework prerequisites first
  setupFrameworkDependencies();

  // Then clear mocks
  jest.clearAllMocks();
  
  // Setup all required mocks
  const { Service } = jest.requireMock('service');
  mockService = Service;
  
  // For chained methods
  mockChainedMethod = mockService().chainedMethod;
  
  // Create instance after mock setup
  instance = new Service();
});`,

    typeSafeReturns: `
Use type-safe mock returns:

// Simple mock return
mockMethod.mockResolvedValue({
  id: '123',
  status: 'success'
});

// Chained mock return with type checking
mockChainedMethod.mockResolvedValue({
  id: expect.any(String),
  status: 'success',
  data: expect.objectContaining({
    key: expect.any(String)
  })
});`
  },

  analysisInstructions: `
For Node.js-specific patterns, analyze:

Module Structure:
- Module exports (CommonJS/ESM)
- Required dependencies
- Internal vs external modules
- Module initialization patterns
- Resource management needs

Function Analysis:
- Pure vs impure functions
- Async operations
- Error handling patterns
- Input validation
- Return types and values
- Method chaining patterns
- Type safety requirements

Dependencies:
- External module usage
- File system operations
- Network requests
- Database operations
- Third-party services
- Environment variables
- Chained method dependencies

Error Handling:
- Error types and classes
- Error propagation
- Async error handling
- Resource cleanup
- Recovery mechanisms
- Chain error propagation
- Console error handling

Testing Requirements:
- Module mocking strategy
- Dependency injection points
- State management
- Resource initialization
- Mock chain setup strategy
- Instance creation order
- Cleanup requirements

Security Considerations:
- Input validation
- File path sanitization
- Environment variable handling
- Secure credential handling
- Network security
- Data validation
- Chain integrity verification
- Error information exposure

Performance Aspects:
- Async operations
- Resource management
- Memory usage
- Connection pooling
- Caching strategies
- Mock chain efficiency
- Cleanup performance

Testing Strategy:
- Unit test isolation
- Integration points
- Mock requirements
- Test data setup
- Resource cleanup
- Chain isolation
- Instance management
- Error simulation`
};

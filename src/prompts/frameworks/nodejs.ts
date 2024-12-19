import { FrameworkRules } from './types';

export const nodejsRules: FrameworkRules = {
  name: 'Node.js',
  importStatements: [
    "const jest = require('jest')",
    "const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals')"
  ],

  testingModuleSetup: `
- Import required modules and dependencies
- Setup test environment variables
- Mock external dependencies
- Initialize test data and fixtures`,

  mockingPatterns: [
    'Use jest.mock() for module mocking',
    'Create manual mocks in __mocks__ directory',
    'Use jest.spyOn() for function spying',
    'Mock file system operations',
    'Mock network requests',
    'Mock timers and dates'
  ],

  testFileNaming: '[name].test.js',

  testStructure: [
    "describe('[ModuleName]', () => {",
    '  let instance;',
    '  let dependencies;',
    '',
    '  beforeEach(() => {',
    '    // Setup test instance and dependencies',
    '  });',
    '',
    '  afterEach(() => {',
    '    jest.clearAllMocks();',
    '    // Cleanup resources',
    '  });',
    '',
    "  describe('[functionName]', () => {",
    '    test cases...',
    '  });',
    '});'
  ],

  edgeCases: [
    'Test error handling',
    'Test edge cases and boundary values',
    'Test async operations',
    'Test file system operations',
    'Test network failures',
    'Test resource cleanup'
  ],

  bestPractices: [
    'Follow AAA pattern (Arrange-Act-Assert)',
    'Mock external dependencies',
    'Use descriptive test names',
    'Test both success and failure cases',
    'Clean up resources after tests',
    'Avoid test interdependence',
    'Mock time-dependent operations',
    'Use appropriate matchers'
  ],

  analysisInstructions: `
For Node.js-specific patterns, analyze:

Module Structure:
- Module exports (CommonJS/ESM)
- Required dependencies
- Internal vs external modules
- Module initialization
- Resource management

Function Analysis:
- Pure vs impure functions
- Async operations
- Error handling patterns
- Input validation
- Return types and values
- Side effects

Dependencies:
- External module usage
- File system operations
- Network requests
- Database operations
- Third-party services
- Environment variables

Error Handling:
- Error types and classes
- Error propagation
- Async error handling
- Resource cleanup
- Recovery mechanisms

Testing Requirements:
- Module mocking strategy
- Dependency injection points
- State management
- Resource initialization
- Cleanup requirements

Security Considerations:
- Input validation
- File path sanitization
- Environment variable usage
- Secure credential handling
- Network security
- Data validation

Performance Aspects:
- Async operations
- Resource management
- Memory usage
- Connection pooling
- Caching strategies

Testing Strategy:
- Unit test isolation
- Integration points
- Mock requirements
- Test data setup
- Resource cleanup
- Error simulation`
};

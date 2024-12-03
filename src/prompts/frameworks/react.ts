import { FrameworkRules } from './types';

export const reactRules: FrameworkRules = {
  name: 'React',
  importStatements: [
    "import { render, screen, fireEvent } from '@testing-library/react'",
    "import userEvent from '@testing-library/user-event'",
    "import { act } from 'react-dom/test-utils'"
  ],

  mockingPatterns: [
    'Mock hooks using jest.mock()',
    'Mock context providers',
    'Mock child components',
    'Mock event handlers',
    'Mock API calls'
  ],

  testFileNaming: '[name].test.tsx',

  testStructure: [
    "describe('[ComponentName]', () => {",
    '  const mockProps = {};',
    '  const mockHandlers = {};',
    '',
    '  beforeEach(() => {',
    '    // Setup mocks and render component',
    '  });',
    '',
    '  afterEach(() => {',
    '    jest.clearAllMocks();',
    '  });',
    '',
    "  describe('[behavior]', () => {",
    '    test cases...',
    '  });',
    '});'
  ],

  edgeCases: [
    'Test component loading states',
    'Handle async updates',
    'Test error boundaries',
    'Test side effects',
    'Handle prop changes',
    'Test cleanup on unmount'
  ],

  bestPractices: [
    'Use React Testing Library queries',
    'Test user interactions',
    'Verify component rendering',
    'Test accessibility',
    'Mock API calls',
    'Test error states',
    'Verify state updates',
    'Test component lifecycle'
  ],

  analysisInstructions: `
For React-specific patterns, analyze:

Component Structure:
- Props interface/type definitions
- State management approach
- Event handlers and callbacks
- Render logic and optimization
- Component composition

Data Flow:
- Props drilling patterns
- Context usage and scope
- State management patterns (local/global)
- Effect dependencies and triggers
- Parent-child communication
- Event handling flow
- Data fetching patterns
- Cache invalidation
- Rerender optimization

Hooks Usage:
- Built-in hooks implementation
- Custom hooks patterns
- Hook dependencies and cleanup
- Hook ordering and rules
- Memoization usage
- Side effect management

Security Considerations:
- XSS prevention in rendering
- Sanitization of user inputs
- Secure form handling
- Authentication state management
- Protected route implementation
- API security patterns
- Sensitive data handling
- CSRF protection in forms

Testing Considerations:
- Component rendering strategies
- User interaction testing
- State change verification
- Hook testing patterns
- Async operation testing
- Security testing scenarios
- Integration test requirements`
};

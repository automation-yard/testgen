import { FrameworkRules } from './types';

export const expressRules: FrameworkRules = {
  name: 'Express',
  analysisInstructions: `
For Express-specific patterns, analyze:

Middleware Chain:
- Middleware order and dependencies
- Error handling middleware
- Authentication/Authorization middleware
- Request preprocessing
- Custom middleware implementation

Request/Response:
- Route parameters and validation
- Query parameters handling
- Request body parsing
- Response formatting
- Status codes and headers
- Error response structure

Data Flow:
- Middleware chain execution flow
- Request lifecycle and modifications
- Response transformation pipeline
- Error propagation patterns
- Data persistence interactions
- Service layer communication
- Event emitter patterns

Security Considerations:
- Authentication middleware requirements
- Authorization checks and middleware
- Session/token handling and validation
- CSRF protection
- Rate limiting implementation
- Input sanitization
- SQL/NoSQL injection prevention
- Security headers and best practices
- Cookie security and options

Testing Considerations:
- Middleware isolation and testing
- Request/Response mocking
- Session handling in tests
- Security testing scenarios
- Integration test requirements`,
 
  mockingPatterns: [
    'Mock request and response objects',
    'Use jest.mock() for middleware',
    'Mock express Router instances',
    'Mock database connections',
    'Spy on middleware functions'
  ],

  testFileNaming: '[name].test.ts',

  testStructure: [
    "describe('[ControllerName]', () => {",
    '  let app: express.Application;',
    '  let mockDependencies;',
    '',
    '  beforeEach(() => {',
    '    app = express();',
    '    // Setup middleware and routes',
    '  });',
    '',
    '  afterEach(() => {',
    '    jest.clearAllMocks();',
    '  });',
    '',
    "  describe('[routeHandler]', () => {",
    '    test cases...',
    '  });',
    '});'
  ],

  edgeCases: [
    'Test middleware error handling',
    'Test route parameter validation',
    'Handle async middleware',
    'Test error middleware',
    'Handle file uploads',
    'Test streaming responses'
  ],

  bestPractices: [
    'Test middleware in isolation',
    'Mock external services',
    'Test request validation',
    'Verify response structure',
    'Test error handling middleware',
    'Check HTTP status codes',
    'Validate response headers',
    'Test query parameters'
  ]
};

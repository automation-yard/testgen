import { FrameworkRules } from "./types";

export const nestJSRules: FrameworkRules = {
  name: "NestJS",
  importStatements: [
    "import { Test, TestingModule } from '@nestjs/testing'",
    "import { ModuleRef } from '@nestjs/core'",
  ],

  testingModuleSetup: `
- Create TestingModule using Test.createTestingModule()
- Configure providers with appropriate mocks
- Override providers using overrideProvider() when needed
- Compile and initialize the module
- Get service instance from module.get()`,

  mockingPatterns: [
    "Use jest.mock() for external modules and services",
    "Create mock providers using useValue syntax",
    "Use jest.spyOn() for method mocking",
    "Implement partial mocks using Partial<Interface>",
    "Mock dependency injection tokens",
  ],

  dependencyInjection: {
    patterns: [
      "Constructor-based injection",
      "Property-based injection",
      "Token-based injection",
    ],
    mockingStrategy: [
      "Mock all injected dependencies in provider array",
      "Use useValue to provide mock implementations",
      "Handle circular dependencies with forwardRef",
      "Mock custom providers and injection tokens",
    ],
  },

  decorators: {
    patterns: [
      "@Injectable()",
      "@Inject()",
      "@Optional()",
      "Custom parameter decorators",
    ],
    testingStrategy: [
      "Mock decorated properties",
      "Test decorator behavior",
      "Verify decorator metadata",
      "Test optional dependencies",
    ],
  },

  testFileNaming: "[name].service.spec.ts",

  testStructure: [
    "describe('[ServiceName]', () => {",
    "  let service: ServiceType;",
    "  let module: TestingModule;",
    "  let dependencyMocks;",
    "",
    "  beforeEach(async () => {",
    "    const module: TestingModule = await Test.createTestingModule({",
    "      providers: [...mockProviders]",
    "    }).compile();",
    "",
    "    service = module.get<ServiceType>(ServiceType);",
    "  });",
    "",
    "  afterEach(() => {",
    "    jest.clearAllMocks();",
    "  });",
    "",
    "  describe('[methodName]', () => {",
    "    test cases...",
    "  });",
    "});",
  ],

  edgeCases: [
    "Handle circular dependencies",
    "Test optional dependency scenarios",
    "Test custom provider edge cases",
    "Handle async initialization",
    "Test lifecycle hooks",
    "Handle dependency injection errors",
  ],

  bestPractices: [
    "Use TestingModule for dependency injection",
    "Mock all external dependencies",
    "Test both sync and async methods",
    "Verify dependency method calls",
    "Test error handling and edge cases",
    "Clear mocks between tests",
    "Use appropriate scope for providers",
    "Test lifecycle hooks when present",
  ],

  analysisInstructions: `
For NestJS-specific patterns, analyze:

Dependency Analysis:
- Required imports and their sources
- Service dependencies and their interfaces
- Repository dependencies and their methods
- Entity dependencies and their relationships
- Exception types and their usage
- Custom providers and tokens
- Optional vs required dependencies

Dependency Injection:
- Constructor injection patterns (@Injectable())
- Property injection patterns (@Inject())
- Custom providers and injection tokens
- Provider scope (DEFAULT, REQUEST, TRANSIENT)
- Circular dependency handling

Module Structure:
- Module dependencies and imports
- Provider registration and exports
- Entity imports (TypeORM/Mongoose)
- Custom provider definitions
- Module configuration

Data Flow:
- Service method call chains
- Repository method usage
- Entity transformations
- Exception handling flow
- Transaction management
- Event emission patterns

Testing Setup Requirements:
- Required TestingModule configuration
- Mock provider implementations
- Repository method mocks
- Entity factory requirements
- Transaction handling in tests
- Exception testing setup

Mock Implementation Guide:
- Complete mock objects for each dependency
- Required mock method signatures
- Mock return type specifications
- Mock error scenarios
- Mock state management

Security Considerations:
- Guards implementation and requirements
- Role-based access control (RBAC)
- Authentication strategies
- Authorization checks
- Interceptor security implications
- Custom decorator security aspects
- Input validation and sanitization
- Request validation pipes

Testing Considerations:
- TestingModule setup requirements
- Complete mock provider setup
- Repository method mocking patterns
- Entity factory patterns
- Transaction handling
- Exception testing patterns
- Security testing scenarios`,
};

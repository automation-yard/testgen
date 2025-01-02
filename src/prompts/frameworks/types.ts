export interface MockStructurePatterns {
  frameworkSetup: string;
  simpleMock: string;
  chainedMethods: string;
  mockSetup: string;
  typeSafeReturns: string;
}

export interface FrameworkRules {
  // Framework identification
  name: string;
  // importStatements: string[];

  // Testing module setup
  testingModuleSetup?: string;
  mockingPatterns: string[];

  // Framework-specific patterns
  dependencyInjection?: {
    patterns: string[];
    mockingStrategy: string[];
  };
  decorators?: {
    patterns: string[];
    testingStrategy: string[];
  };
  mockStructurePatterns?: MockStructurePatterns;

  // Test organization
  testFileNaming: string;
  testStructure: string[];

  // Special considerations
  edgeCases: string[];
  bestPractices: string[];

  // Analysis instructions
  analysisInstructions: string;
}

export interface FrameworkPromptBuilder {
  buildSetupInstructions(): string;
  buildMockingInstructions(): string;
  buildTestStructureInstructions(): string;
  buildSpecialConsiderations(): string;
}

export interface FrameworkRules {
  // Framework identification
  name: string;
  importStatements: string[];

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

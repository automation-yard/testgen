interface JestConfig {
  testEnvironment: string;
  transform: Record<string, string | [string, Record<string, any>]>;
  moduleFileExtensions: string[];
  setupFilesAfterEnv?: string[];
  testMatch?: string[];
  moduleNameMapper?: Record<string, string>;
  collectCoverage?: boolean;
  coverageReporters?: string[];
  coverageDirectory?: string;
  rootDir?: string;
  transformIgnorePatterns?: string[];
  globals?: Record<string, any>;
  setupFiles?: string[];
}

const baseConfig: JestConfig = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: true
          },
          transform: {
            react: {
              runtime: 'automatic'
            }
          }
        }
      }
    ]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  }
};

export const defaultJestConfigs: Record<string, JestConfig> = {
  default: baseConfig,

  react: {
    ...baseConfig,
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['@testing-library/jest-dom'],
    testMatch: [
      '**/__tests__/**/*.[jt]s?(x)',
      '**/?(*.)+(spec|test).[jt]s?(x)'
    ],
    transformIgnorePatterns: [
      '/node_modules/(?!(@testing-library|react|react-dom)/)'
    ],
    moduleNameMapper: {
      ...baseConfig.moduleNameMapper,
      '^@/(.*)$': '<rootDir>/src/$1',
      '^react$': 'react',
      '^react-dom$': 'react-dom',
      '^@testing-library/react$': '@testing-library/react'
    }
  },

  express: {
    ...baseConfig,
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.[jt]s', '**/?(*.)+(spec|test).[jt]s']
  },

  nestjs: {
    ...baseConfig,
    testEnvironment: 'node',
    moduleNameMapper: {
      ...baseConfig.moduleNameMapper,
      '^@/(.*)$': '<rootDir>/src/$1'
    }
  },

  nodejs: {
    ...baseConfig,
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.[jt]s', '**/?(*.)+(spec|test).[jt]s'],
    moduleFileExtensions: ['js', 'json', 'ts', 'node'],
    transform: {
      '^.+\\.(t|j)s$': '@swc/jest'
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
    },
    globals: {
      'ts-jest': {
        tsconfig: 'tsconfig.json'
      }
    },
    setupFiles: ['<rootDir>/test/setup-env.js']
  }
};

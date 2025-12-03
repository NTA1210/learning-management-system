const tsJestTransformCfg = { '^.+\\.tsx?$': ['ts-jest', {}] };

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: 'node',
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: [
    '**/*.test.ts', // ✅ bỏ ngoặc vuông thừa
    // "**/__tests__/{lesson,lessonMaterial,lessonProgress}/**/*.test.ts"
  ],
  // 🚫 Bỏ qua thư mục integration-test
  testPathIgnorePatterns: ['<rootDir>/src/__tests__/integration/'],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/config/',
    '<rootDir>/src/utils',
    '<rootDir>/src/models',
    '<rootDir>/src/constants/',
    '<rootDir>/src/validators/',
    '<rootDir>/src/types/',
    '<rootDir>/src/services/helpers/',
  ],

  //Threshold >= 80%
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/controller/': {
      branches: 85,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  verbose: true,
  forceExit: true,
};

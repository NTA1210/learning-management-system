const tsJestTransformCfg = { "^.+\\.tsx?$": ["ts-jest", {}] };

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  testMatch: [
    "**/*.test.ts", // ✅ bỏ ngoặc vuông thừa
    // "**/__tests__/{lesson,lessonMaterial,lessonProgress}/**/*.test.ts"
  ],
  // 🚫 Bỏ qua thư mục integration-test
  testPathIgnorePatterns: ["<rootDir>/src/__tests__/integration/"],
  coveragePathIgnorePatterns: [
    "<rootDir>/src/config/",
    "<rootDir>/src/utils",
    "<rootDir>/src/models",
    "<rootDir>/src/constants/",
    "<rootDir>/src/validators/",
    "<rootDir>/src/types/",
  ],
  verbose: true,
  forceExit: true,
};

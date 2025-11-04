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
  setupFilesAfterEnv: [
    "<rootDir>/src/setupTests.ts", // ✅ bỏ ngoặc vuông thừa
    // "<rootDir>/src/setupTests.unit.ts",
  ],
  testMatch: [
    "**/*.test.ts", // ✅ bỏ ngoặc vuông thừa
    // "**/__tests__/{lesson,lessonMaterial,lessonProgress}/**/*.test.ts"
  ],
  verbose: true,
  forceExit: true,
};

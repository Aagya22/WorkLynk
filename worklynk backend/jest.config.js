/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  // Load test env (NODE_ENV, secrets, test DB URI) before any app module imports.
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  clearMocks: true,
  // Real Mongo round-trips plus bcrypt(12) in the lockout loop need headroom.
  testTimeout: 30000,
};

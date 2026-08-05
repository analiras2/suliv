// eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest loads this config with require(), so it must stay CommonJS.
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/node_modules/', '<rootDir>/.next/'],
};

module.exports = createJestConfig(config);

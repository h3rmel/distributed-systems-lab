import baseConfig from './base.js';

/**
 * ESLint configuration for NestJS projects (apps/ingestion-api)
 * Extends base config with backend-specific rules
 */
export default [
  ...baseConfig,

  // NestJS-specific overrides
  {
    rules: {
      // Allow console for structured logging (pino handles this)
      'no-console': 'off',

      // NestJS uses empty constructors for DI
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',

      // Allow empty functions (NestJS lifecycle hooks can be empty)
      '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],
    },
  },
];

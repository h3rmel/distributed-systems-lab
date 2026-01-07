import baseConfig from './base.js';
import globals from 'globals';

/**
 * ESLint configuration for Node.js projects (apps/stream-engine)
 * Extends base config with Node.js-specific rules for stream processing
 */
export default [
  ...baseConfig,

  // Node.js-specific configuration
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow console for CLI output and logging
      'no-console': 'off',

      // Enforce async patterns for stream safety
      'require-await': 'error',
      'no-return-await': 'error',

      // Prevent common memory leak patterns
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
];

import baseConfig from './base.js';
import globals from 'globals';

/**
 * ESLint configuration for Next.js projects (apps/live-dashboard)
 * Extends base config with React/browser-specific rules
 */
export default [
  ...baseConfig,

  // Next.js/React-specific configuration
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    rules: {
      // React 18+ doesn't require React import
      'react/react-in-jsx-scope': 'off',

      // Allow console in development (Next.js handles this)
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
];

import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,  // Changed from 2022 to 2024
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  {
    ignores: [
      'node_modules/**', 
      'dist/**', 
      'coverage/**',
      'test-connection.js',
    ],
  },
];

// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import { type } from 'node:os';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist', 'node_modules'],
  },

  eslint.configs.recommended,

  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      // ========= TypeScript =========
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-floating-promises': 'error',

      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',

      // ========= JS =========
      'no-console': 'off',
      'no-debugger': 'error',
    },
  },
);
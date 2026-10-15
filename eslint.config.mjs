import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Animation code is imperative by design (see docs/nextjs-migration/PLAN.md §7).
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    // Validation tests feed the rules data the type system would reject on purpose.
    files: ['tests/**/*.test.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  globalIgnores(['.claude/**', 'legacy/**', 'out/**', '.next/**', 'dist/**', 'node_modules/**', 'next-env.d.ts']),
]);

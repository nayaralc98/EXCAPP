import js from '@eslint/js';
import { flatConfigs as importX } from 'eslint-plugin-import-x';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import tseslint from 'typescript-eslint';


// The shared totalum-contracts rules, inlined: a customer copy installs with `npm ci` and cannot reach that
// private package (plan 06 §1).
export default tseslint.config(
  {
    ignores: [
      'node_modules',
      'drizzle',
      '.next',
      '.open-next',
      '.wrangler',
      'next-env.d.ts',
      'worker.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  importX.recommended,
  {
    plugins: { 'no-only-tests': noOnlyTests },
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      'no-only-tests/no-only-tests': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import-x/no-unresolved': 'off',
      'import-x/order': ['error', { alphabetize: { order: 'asc' }, 'newlines-between': 'always' }],
    },
  },
  { files: ['**/*.js', '**/*.mjs', '**/*.cjs'], ...tseslint.configs.disableTypeChecked },
  // Node scripts: TypeScript does not check them, and no-undef does not know Node's globals.
  { files: ['scripts/**/*.mjs', 'scripts/**/*.cjs', 'tools/**/*.mjs'], rules: { 'no-undef': 'off' } },
  // Turbopack loaders must be CommonJS (plan 06 §9).
  { files: ['scripts/**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
);

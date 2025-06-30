import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    // ✅ Tell ESLint not to lint these folders or files
    ignores: ['node_modules', 'public', 'views', 'eslint.config.mjs'],
  },
  {
    // ✅ Lint only CommonJS files properly
    files: ['**/*.{js,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  prettier, // ✅ Prettier last to avoid style rule conflict
]);

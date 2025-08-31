// eslint.config.mjs — ESLint v9 Flat Config
import eslintJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // 不掃這些（含 Next 生成檔）
  { ignores: ['core/**', 'node_modules/**', '.next/**', 'dist/**', 'next-env.d.ts'] },

  // 讓瀏覽器/Node 全域識別（解 localStorage, window, document…）
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // 推薦規則
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,

  // 先把吵的規則關掉（不影響執行）
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': 'off',
    },
  },

  // Next.js 規則（調整幾條不阻塞開發）
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      // 先不強制用 <Image/>，之後要優化再打開
      '@next/next/no-img-element': 'off',
    },
  },
];

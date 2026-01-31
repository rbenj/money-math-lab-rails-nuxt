import { createConfigForNuxt } from '@nuxt/eslint-config';

export default createConfigForNuxt({
  features: {
    stylistic: false,
  },
})
  .prepend({
    ignores: ['.nuxt/**', '.output/**', 'dist/**', 'node_modules/**'],
  })
  .override('nuxt/vue/rules', {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
    },
  })
  .override('nuxt/typescript/rules', {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-import-type-side-effects': 'warn',
    },
  });

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  typescript: { strict: true },
  devtools: { enabled: true },
  css: ['@/assets/css/main.css'],

  modules: [
    '@nuxtjs/color-mode'
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:3001/api/v1',
    }
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },
})

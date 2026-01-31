// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  typescript: { strict: true },
  devtools: { enabled: true },
  css: ["@/assets/css/main.css"],

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || "http://localhost:3001/api/v1",
    },
  },

  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  },

  modules: ["@nuxtjs/color-mode", "shadcn-nuxt"],

  shadcn: {
    prefix: "",
    componentDir: "./app/components/ui",
  },

  colorMode: {
    classSuffix: "",
    preference: "light",
    fallback: "light",
  },
});

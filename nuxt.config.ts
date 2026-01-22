// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  ssr: false, // Client-side only for LocalStorage
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
    typeCheck: false
  },
  devServer: {
    port: 3002
  }
})
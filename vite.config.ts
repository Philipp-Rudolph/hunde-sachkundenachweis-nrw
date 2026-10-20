import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

const themeColor = '#1f5f8b'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      disable: Boolean(process.env.VITEST),
      registerType: 'autoUpdate',
      // Icons are already matched by workbox.globPatterns; the plugin adds the manifest itself.
      includeManifestIcons: false,
      manifest: {
        name: 'Sachkunde-Quiz Hund NRW',
        short_name: 'Sachkunde-Quiz',
        description: 'Offline lernen für den Sachkundenachweis Hund in NRW',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        theme_color: themeColor,
        background_color: '#f6f5f2',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // questions.json is bundled into the JS; question images are hashed PNG assets.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

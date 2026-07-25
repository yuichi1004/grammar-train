/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // main.tsx で virtual:pwa-register を明示的に呼び、更新チェックの
      // タイミングを制御する（iOS のホーム画面アプリ対策）ので自動注入しない
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Grammar Train',
        short_name: 'GrammarTrain',
        description: '英語の前置詞・冠詞・可算/不可算名詞を穴埋めタイピングで練習するアプリ',
        lang: 'ja',
        start_url: '/',
        display: 'standalone',
        background_color: '#f7f7f5',
        theme_color: '#2563eb',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})

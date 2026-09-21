import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// IMPORTANT: change this to match your GitHub repository name if it is
// different from "metro-alert". For a repo at github.com/<user>/metro-alert
// the base path below is correct for GitHub Pages project sites.
const REPO_NAME = 'metro-alert';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Metro Alert',
        short_name: 'Metro Alert',
        description: "Get notified when you reach your metro destination.",
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#111827',
        background_color: '#ffffff',
        start_url: '.',
        scope: '.',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        // App-shell caching: allow the PWA to load and run after the first
        // visit even when the network is temporarily unavailable. This does
        // NOT enable background tracking while the app/browser is closed.
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: { cacheName: 'html-cache' }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true
  }
});

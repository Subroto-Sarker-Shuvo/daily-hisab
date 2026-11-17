import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Daily Hisab - দৈনিক হিসাব খাতা',
        short_name: 'Daily Hisab',
        description: 'দৈনন্দিন আয়-ব্যয় ও দেনা-পাওনা হিসাব খাতা - Offline Personal Finance PWA',
        theme_color: '#059669',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
  },
});

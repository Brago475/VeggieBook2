import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server config for the admin site. Same idea as web/vite.config.ts:
// /api and /images go to the live stack, so the code calls fetch('/api/...')
// with no host, exactly as it will in production.
//
// Port 5174 so the admin site and the public site can run side by side
// (the public site uses Vite's default, 5173).
//
// TODO: when /api/admin/ is limited to admin.veggiebook2.com, this target
// needs a way through for local development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://veggiebook2.com',
        changeOrigin: true,
      },
      '/images': {
        target: 'https://veggiebook2.com',
        changeOrigin: true,
      },
    },
  },
})
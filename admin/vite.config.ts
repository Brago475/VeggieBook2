import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server config for the admin site. Same idea as web/vite.config.ts:
// /api and /images go to the live stack, so the code calls fetch('/api/...')
// with no host, exactly as it will in production.
//
// The target is admin.veggiebook2.com, because the public site refuses
// /api/admin/ (deploy/nginx.conf). The admin site serves /api and /images
// through its own nginx (deploy/nginx-admin.conf).
//
// Port 5174 so the admin site and the public site can run side by side
// (the public site uses Vite's default, 5173).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://admin.veggiebook2.com',
        changeOrigin: true,
      },
      '/images': {
        target: 'https://admin.veggiebook2.com',
        changeOrigin: true,
      },
    },
  },
})
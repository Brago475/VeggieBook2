import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server config.
//
// The proxy forwards any request starting with /api to the live stack on
// veggiebook2.com. That way the React code calls fetch('/api/vegetables')
// with no host in the URL, exactly as it will in production, and nothing
// has to change when the app is eventually built and served by nginx.
//
// changeOrigin rewrites the Host header to match the target. Without it
// Cloudflare sees a request for localhost and rejects it.
export default defineConfig({
  plugins: [react()],
  server: {
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
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server proxies /api to the local API and /images to the live site,
// so the browser sees one origin and never makes a cross-origin request. That
// matches production, where nginx serves the built app and proxies /api to the
// api container. Proxying images avoids copying 136 MB into the dev setup.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5143',
      '/images': {
        target: 'https://veggiebook2.com',
        changeOrigin: true,
      },
    },
  },
})

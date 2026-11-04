import { defineConfig, type Plugin } from 'vite'
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
//
// Every build gets a version (its build time). It is compiled into the app
// as __APP_VERSION__ and written to dist/version.json, which open tabs check
// to reload after a deploy (src/hooks/useNewVersion.ts).

const version = new Date().toISOString()

function versionFile(): Plugin {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version }),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), versionFile()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
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
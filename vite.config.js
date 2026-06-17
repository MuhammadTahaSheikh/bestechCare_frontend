import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const LIVE_API = 'https://instacare-api.bestechvision.com'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (env.VITE_API_URL || LIVE_API).replace(/\/$/, '')

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
        '/socket.io': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
          ws: true,
        },
      },
    },
  }
})

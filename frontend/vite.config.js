import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8001'

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: "Transy by The Modern Savannah",
        short_name: "Transy",
        description: "Real-time transport dispatch and passenger tracking for Saccos.",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/?pwa=true",
        icons: [
          {
            src: "/icons.svg",
            sizes: "any",
            type: "image/svg+xml"
          },
          {
            src: "/transy_logo.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': apiProxyTarget
    }
  }
}
})

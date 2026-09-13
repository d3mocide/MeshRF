import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const CARTO_BASEMAP_ORIGIN = 'https://basemaps.cartocdn.com'

/**
 * Builds the dev/preview equivalent of the `/basemaps` proxy in nginx.conf.
 *
 * CARTO watermarks unauthenticated raster tiles, so they need an API key. The
 * key is read from `CARTO_API_KEY` -- deliberately *without* a `VITE_` prefix,
 * because a `VITE_`-prefixed variable is inlined into the client bundle, which
 * would publish the key to every visitor. Appending it here keeps it in the
 * Node process: the browser only ever requests same-origin `/basemaps/...`.
 */
const cartoProxy = (apiKey) => ({
  target: CARTO_BASEMAP_ORIGIN,
  changeOrigin: true,
  rewrite: (path) => {
    // Drop any client-supplied query string so the key cannot be overridden.
    const tilePath = path.replace(/^\/basemaps/, '').split('?')[0]
    return apiKey ? `${tilePath}?key=${encodeURIComponent(apiKey)}` : tilePath
  }
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix so non-`VITE_` server-side settings in a local .env are
  // visible to this config. These stay in Node; nothing here is exposed
  // to the client via `define`.
  const env = loadEnv(mode, process.cwd(), '')
  const cartoApiKey = env.CARTO_API_KEY || ''

  const proxy = {
    '/api': {
      target: env.API_TARGET || 'http://localhost:5001',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    },
    '/basemaps': cartoProxy(cartoApiKey)
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'meshRF',
          short_name: 'meshRF',
          description: 'Advanced RF Link Analysis and Mesh Planning',
          theme_color: '#0a0a0f',
          background_color: '#0a0a0f',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait-primary',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api'),
              handler: 'NetworkOnly',
              options: {
                backgroundSync: {
                  name: 'api-queue',
                  options: {
                    maxRetentionTime: 5
                  }
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    server: {
      host: true, // Needed for Docker
      allowedHosts: env.ALLOWED_HOSTS
        ? (env.ALLOWED_HOSTS === 'true' ? true : env.ALLOWED_HOSTS.split(','))
        : undefined,
      watch: {
        usePolling: true, // Needed for Windows file system in Docker
      },
      proxy
    },

    // `vite preview` does not inherit server.proxy, so the built app would lose
    // both the API and basemap proxies without this.
    preview: {
      proxy
    },

    test: {
      globals: true,
      environment: "jsdom",
    }
  }
})

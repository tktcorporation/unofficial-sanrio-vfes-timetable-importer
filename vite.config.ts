// vite.config.ts
import adapter from '@hono/vite-dev-server/cloudflare'
import { reactRouter } from '@react-router/dev/vite'
import { cloudflareDevProxy as remixCloudflareDevProxy } from '@react-router/dev/vite/cloudflare'
import serverAdapter from 'hono-react-router-adapter/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { getLoadContext } from './load-context'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    remixCloudflareDevProxy(),
    reactRouter(),
    serverAdapter({
      adapter,
      getLoadContext,
      entry: 'server/index.ts',
    }),
    tsconfigPaths(),
  ],
  server: {
    host: '0.0.0.0',
  },
})

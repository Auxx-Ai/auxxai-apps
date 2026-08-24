import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@auxx/sdk/server': new URL('./tests/__mocks__/auxx-sdk-server.ts', import.meta.url).pathname,
    },
  },
})

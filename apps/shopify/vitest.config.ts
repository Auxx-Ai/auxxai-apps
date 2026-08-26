import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      // `@auxx/sdk`'s "." export is types-only — at build time both the client and server
      // builds externalize it to the injected `AUXX_ROOT_SDK` global, so it never needs a
      // runtime entry. Tests have no such injection, so point at the built implementation.
      '@auxx/sdk': new URL('./node_modules/@auxx/sdk/lib/root/index.js', import.meta.url).pathname,
    },
  },
})

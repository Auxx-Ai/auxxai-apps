import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    // Order matters: a string alias matches the exact id OR the id prefixed with `<key>/`,
    // and the first match wins. `@auxx/sdk/server` must therefore precede `@auxx/sdk`, or
    // the broader key would rewrite it to `.../lib/root/index.js/server`.
    alias: {
      // The SDK's "./server" export is types-only, so it has no runtime entry to resolve.
      // Modules under test that pull in the SDK's server helpers or error classes (e.g.
      // `shared/shopify-api.ts`) fail with `No known conditions for "./server" specifier`
      // without this. Point at the built implementation.
      '@auxx/sdk/server': new URL('./node_modules/@auxx/sdk/lib/server/index.js', import.meta.url)
        .pathname,
      // `@auxx/sdk`'s "." export is types-only — at build time both the client and server
      // builds externalize it to the injected `AUXX_ROOT_SDK` global, so it never needs a
      // runtime entry. Tests have no such injection, so point at the built implementation.
      '@auxx/sdk': new URL('./node_modules/@auxx/sdk/lib/root/index.js', import.meta.url).pathname,
    },
  },
})

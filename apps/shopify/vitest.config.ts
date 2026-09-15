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
      // without this. Use source: the published server index is a runtime-injected stub.
      '@auxx/sdk/server': new URL('./node_modules/@auxx/sdk/src/server/index.ts', import.meta.url)
        .pathname,
      // Same trap for the two runtime subpaths the connector MANIFEST
      // (`shopify.connector.ts`) imports: without these the broad `@auxx/sdk`
      // key below rewrites them to `.../lib/root/index.js/data-connectors`.
      // Needed by any test that reads the manifest's mapping rows.
      '@auxx/sdk/data-connectors': new URL(
        './node_modules/@auxx/sdk/lib/root/data-connectors/index.js',
        import.meta.url,
      ).pathname,
      '@auxx/sdk/tools': new URL(
        './node_modules/@auxx/sdk/lib/root/tools/index.js',
        import.meta.url,
      ).pathname,
      // `@auxx/sdk`'s "." export is types-only — at build time both the client and server
      // builds externalize it to the injected `AUXX_ROOT_SDK` global, so it never needs a
      // runtime entry. Tests have no such injection, so point at the built implementation.
      '@auxx/sdk': new URL('./node_modules/@auxx/sdk/lib/root/index.js', import.meta.url).pathname,
    },
  },
})

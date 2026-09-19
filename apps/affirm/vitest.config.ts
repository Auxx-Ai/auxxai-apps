import { defineConfig } from 'vitest/config'

const sdk = (path: string) => new URL(`./node_modules/@auxx/sdk/${path}`, import.meta.url).pathname

// The platform repo, a sibling checkout. `package.json` already pins the SDK with
// `link:/Users/mklooth/Sites/auxxai/packages/sdk`, so the layout is assumed either way;
// this at least stays relative.
const platform = (path: string) => new URL(`../../../auxxai/${path}`, import.meta.url).pathname

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    // Order matters: a string alias matches the exact id OR the id prefixed with `<key>/`,
    // and the first match wins. `@auxx/sdk/server` must precede `@auxx/sdk`, or the broader
    // key would rewrite it to `.../lib/root/index.js/server`.
    alias: {
      // The money contract the settlement translation must satisfy, imported from the
      // platform repo so the tests run the PLATFORM's own `assessPayoutMembership` and zod
      // schemas rather than a copy that could drift away from them.
      '@auxx/lib/money/payouts/evidence-contracts': platform(
        'packages/lib/src/accounting/money/customer-money/evidence-contracts.ts'
      ),
      // The CONNECTOR path validates against these, not against the evidence
      // contracts above: `processorRecordEntrySchema` is where `providerType` is
      // actually declared, which is why the connector emits it.
      '@auxx/lib/money/payouts/record-contracts': platform(
        'packages/lib/src/accounting/money/customer-money/record-contracts.ts'
      ),
      // ...which needs one leaf helper from the platform's utils package.
      '@auxx/utils/currency': platform('packages/utils/src/currency.ts'),
      // The SDK's "./server" export is types-only, so it has no runtime entry to resolve.
      // Point at SOURCE: the published `lib/server/index.js` is a build:strip stub that
      // exports nothing, so aliasing there resolves the error classes to `undefined`.
      '@auxx/sdk/server': sdk('src/server/index.ts'),
      // The three RUNTIME subpaths the connector manifest and its server handler import.
      // Without an explicit entry each, the broad `@auxx/sdk` key below rewrites them to
      // `.../lib/root/index.js/<subpath>` and every connector test dies on resolution —
      // the trap the SDK extraction hit in the Shopify app.
      '@auxx/sdk/data-connectors': sdk('lib/root/data-connectors/index.js'),
      '@auxx/sdk/financial-source': sdk('lib/root/financial-source/index.js'),
      '@auxx/sdk/tools': sdk('lib/root/tools/index.js'),
      // `@auxx/sdk`'s "." export is types-only too — both builds externalize it to the
      // injected `AUXX_ROOT_SDK` global. Tests have no such injection.
      '@auxx/sdk': sdk('lib/root/index.js'),
    },
  },
  server: {
    fs: {
      // Vite refuses to serve files outside the project root without this.
      allow: [new URL('.', import.meta.url).pathname, platform('')],
    },
  },
})

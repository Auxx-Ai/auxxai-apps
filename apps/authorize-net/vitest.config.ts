import { defineConfig } from 'vitest/config'

const sdk = (path: string) => new URL(`./node_modules/@auxx/sdk/${path}`, import.meta.url).pathname

// `auxxai-authorize-net` is the sibling PLATFORM worktree this app is built against; the
// money contract is read from there rather than from the main `auxxai` checkout, which is
// on a different branch. (`package.json` still links `@auxx/sdk` to the main checkout,
// because only that one carries a built `lib/`.)
const platform = (path: string) =>
  new URL(`../../../auxxai-authorize-net/${path}`, import.meta.url).pathname

const mainCheckout = new URL('../../../auxxai/', import.meta.url).pathname

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
      // The platform's own schemas and `assessPayoutMembership`, so the tests assert against
      // the contract itself rather than a copy of it that could drift.
      '@auxx/lib/money/payouts/evidence-contracts': platform(
        'packages/lib/src/accounting/money/customer-money/evidence-contracts.ts'
      ),
      // The CONNECTOR path validates against these: `processorRecordEntrySchema` is where
      // `providerType` is declared, which is why the connector emits it.
      '@auxx/lib/money/payouts/record-contracts': platform(
        'packages/lib/src/accounting/money/customer-money/record-contracts.ts'
      ),
      // The client-safe half of the payout module: `splitStoredEntries` is what
      // decides whether a zero fee mints a fee leg. It imports only types from
      // the server half, so it resolves without a database.
      '@auxx/lib/money/payouts/client': platform(
        'packages/lib/src/accounting/money/payouts/client.ts'
      ),
      '@auxx/utils/currency': platform('packages/utils/src/currency.ts'),
      // The SDK's "./server" export is types-only, so it has no runtime entry to resolve.
      // Point at SOURCE: the published `lib/server/index.js` is a build:strip stub.
      '@auxx/sdk/server': sdk('src/server/index.ts'),
      '@auxx/sdk/data-connectors': sdk('lib/root/data-connectors/index.js'),
      '@auxx/sdk/financial-source': sdk('lib/root/financial-source/index.js'),
      '@auxx/sdk/tools': sdk('lib/root/tools/index.js'),
      '@auxx/sdk': sdk('lib/root/index.js'),
    },
  },
  server: {
    fs: {
      // Vite refuses to serve files outside the project root without this.
      allow: [new URL('.', import.meta.url).pathname, platform(''), mainCheckout],
    },
  },
})

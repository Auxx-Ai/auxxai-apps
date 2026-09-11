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
      // `shared/shipstation-api.ts` pulls in the SDK's error classes and fails with
      // `No known conditions for "./server" specifier` without this.
      //
      // 🛑 This points at `lib/shared`, NOT at `lib/server` where the other apps point.
      // `lib/server/index.js` is emitted by `build:strip` as a 126-byte stub reading
      // "Implementation stripped - provided by runtime", and it exports NOTHING: the
      // platform injects those helpers at run time. So every app whose config aliases
      // there resolves the SDK error classes to `undefined`, and `new InvalidInputError()`
      // throws `TypeError: InvalidInputError is not a constructor`.
      //
      // That is not a broken build, it is what `pnpm build` (`build:types && build:strip`)
      // always produces. Configs pointing at `lib/server` only ever worked against a stale
      // artifact from a run that skipped the strip, and they break the next time anyone
      // rebuilds the SDK. It cost four lanes 32 failing tests on 2026-09-11.
      //
      // `lib/shared/index.js` is not stripped and is where the error classes actually live:
      // AuxxError and every subclass, plus BlockValidationError and BlockRuntimeError. The
      // run-time helpers (`getConnection`, `getOrganizationSetting`) are absent from both
      // files, so nothing is lost by pointing here, and tests must mock those regardless.
      '@auxx/sdk/server': new URL('./node_modules/@auxx/sdk/lib/shared/index.js', import.meta.url)
        .pathname,
      // `@auxx/sdk`'s "." export is types-only: both builds externalize it to the injected
      // `AUXX_ROOT_SDK` global, so it never needs a runtime entry. Tests have no such
      // injection.
      '@auxx/sdk': new URL('./node_modules/@auxx/sdk/lib/root/index.js', import.meta.url).pathname,
    },
  },
})

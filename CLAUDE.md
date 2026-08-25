# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo of first-party apps for the [Auxx.ai](https://auxx.ai) platform, built with `@auxx/sdk`. Each app lives in `apps/<app-slug>/` as a **self-contained project** with its own dependencies and package.json — day-to-day work happens inside one app directory.

The root `package.json` exists only for the **batch scripts** (`scripts/push-all.ts`) that build or deploy every app at once. See *Deploying and syncing* below.

## Main Platform Codebase

The main Auxx.ai application (including the `@auxx/sdk` source) lives at `/Users/mklooth/Sites/auxxai`. Reference that repo when you need to understand SDK internals, platform APIs, or how apps integrate with the platform.

## Common Commands

All commands run from within an app directory (`apps/<app-slug>/`):

```bash
pnpm install              # install dependencies
pnpm run dev              # local dev server
pnpm lint                 # lint (Biome)
pnpm build                # production build
```

Scaffold a new app:
```bash
cd apps/
pnpm dlx @auxx/sdk init <app-slug>
```

## Deploying and syncing

### The distinction that catches everyone

An app is deployed as either a **`development`** or a **`production`** deployment, and they are not interchangeable:

| | `auxx dev` / `auxx dev --once` | `auxx version create --publish` |
|---|---|---|
| Deployment type | `development` | `production` |
| Scope | ONE organization (`-o <handle>`) | global — auto-rolls every org with the app installed |
| Replaces | that app's previous dev deployment for that org | nothing; creates a new version |

**A local workspace reads the `development` deployment.** `AppInstallation.currentDeploymentId` points at it, so publishing a production version against localhost — however successfully — changes nothing you can see locally. If a local app looks stale after an SDK change, it needs a **dev** deploy, not a publish. (Learned the hard way: a "20 published" run that updated nothing.)

### The batch scripts (run from the repo root)

```bash
pnpm check-all            # auxx build per app — TypeScript + esbuild only, no network
pnpm sync-dev             # auxx dev --once -o demoorg per app — what updates LOCAL dev
pnpm push-dev             # production publish against localhost:3007
pnpm push-prod            # production publish against api.auxx.ai
```

All four run 3 apps concurrently, print the resolved target before anything uploads, and print each failure's full output at the end.

**`check-all` is a weaker gate than it looks.** `auxx build` runs `buildJavaScript` (type-check + bundle). `auxx version create` and `auxx dev` run `bundleJavaScript`, which additionally calls `compileAndExtractCatalog()` — so **catalog extraction is never exercised by `check-all`**, and an `ERROR_EXTRACTING_CATALOG` can only surface during an actual deploy. That matters because extraction *executes the app's own* `schema.computeOutputs` per operation.

**The catalog is extracted client-side, by the CLI.** Whatever `@auxx/sdk` build is linked decides which catalog fields exist. Republishing an app with unchanged source is therefore NOT a no-op after an SDK change: the server's idempotency check compares bundles **and catalog**, so a richer catalog produces a new version.

### Headless auth

`AUXX_API_KEY` (an `auxx_dev_…` developer key) is sent as the bearer ahead of the keychain, skipping OAuth entirely — this is how CI and the batch scripts authenticate. It lives in the repo-root `.env` (gitignored; `scripts/push-all.ts` loads it, and a real environment variable still wins).

Without it and without an interactive terminal, the CLI now exits **1** with an actionable message. It used to print "Press Enter to continue…" and await a `data` event on a stdin that only ever emits `end` — the event loop drained and the process exited **0 having done nothing**, which every batch caller read as success.

Note `auxx whoami` 401s under an API key: it probes better-auth's OAuth `userinfo`, and a developer key is not an access token. Every deploy call it fronts still works, so it is not a usable liveness probe here.

## Code Style

Enforced by [Biome](https://biomejs.dev/) (config at repo root `biome.json`):
- Spaces, indent width 2, line width 100
- Single quotes for JS/TS
- Recommended linter rules enabled
- Import organizing enabled

## CI/CD

- **PRs to main**: CI detects which apps changed and runs `pnpm lint` + `pnpm build` per app
- **Merge to main deploys NOTHING.** `ci.yml` runs on `pull_request` only (type-check + bundle). Publishing is `workflow_dispatch` only — Actions tab → *Publish Apps* → Run workflow — because apps may land features ahead of the production SDK/API supporting them. That run is a PRODUCTION deployment and publishes **every** app, auto-rolling every org with the app installed (see *Deploying and syncing*)
- Authentication is `AUXX_API_KEY`, not the keychain
- Node 20, pnpm

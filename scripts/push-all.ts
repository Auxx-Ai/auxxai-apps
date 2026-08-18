// scripts/push-all.ts
// Batch-publish every first-party app in this monorepo through the public auxx
// CLI (`auxx version create --publish`). Private internal tooling — deliberately
// NOT part of @auxx/sdk's public surface. Unchanged apps are skipped server-side
// (idempotent deploy), so re-running this is cheap: one local bundle pass each.
//
// Pass `--check` for a dry run: builds every app (`auxx build` — type-check +
// bundle, no upload/publish) and reports which ones break, so you can fix
// failures before publishing. `pnpm check-all` is the alias.
//
// THREE modes:
//   --check                  build only, no network (pnpm check-all)
//   --dev-deploy <handle>    one DEVELOPMENT deployment per app for that org —
//                            what a local workspace actually reads (pnpm sync-dev)
//   (default) / --prod       publish a production version per app
//
// TARGET is explicit and defaults to LOCAL DEV. `@auxx/sdk`'s env.ts decides
// where a publish goes from `AUXX_ENV`/`AUXX_API_URL`, read per child process —
// so an `AUXX_ENV=production` left in the shell would silently send the whole
// wave to prod. This script therefore sets the child env itself: local dev
// unless `--prod` is passed, and the resolved URL is printed before anything
// uploads. `pnpm push-dev` / `pnpm push-prod` are the aliases.

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPS_DIR = join(ROOT, 'apps');
const SKIP = new Set(['__template', 'test']);
const CONCURRENCY = 3;
/**
 * Root `.env`, loaded by hand — the repo has one devDependency (tsx) and this
 * needs three lines, not a dependency. Real environment wins: an inline
 * `AUXX_API_KEY=… pnpm sync-dev` must override the file, never the reverse.
 *
 * `AUXX_API_KEY` is the one that matters here: @auxx/sdk's authenticator sends
 * it as the bearer AHEAD of the keychain, so the batch loop runs headless.
 */
function loadDotEnv(): void {
  const file = join(ROOT, '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match || line.trimStart().startsWith('#')) continue;
    const [, key, rawValue] = match;
    if (process.env[key!] !== undefined) continue;
    process.env[key!] = rawValue!.trim().replace(/^["']|["']$/g, '');
  }
}
loadDotEnv();

const CHECK = process.argv.includes('--check');
const PROD = process.argv.includes('--prod');

/**
 * `--dev-deploy <handle>`: create a DEVELOPMENT deployment per app for one
 * organization, instead of publishing a production version.
 *
 * This is what actually syncs a local workspace. `AppInstallation.currentDeploymentId`
 * in local dev points at a *development* deployment (that is what `auxx dev`
 * writes), so a production publish — however successful — changes nothing you
 * can see locally: nothing reads those rows.
 */
const DEV_ORG = (() => {
  const i = process.argv.indexOf('--dev-deploy');
  return i === -1 ? null : (process.argv[i + 1] ?? null);
})();
if (process.argv.includes('--dev-deploy') && !DEV_ORG) {
  process.stderr.write('--dev-deploy needs an organization handle, e.g. --dev-deploy demoorg\n');
  process.exit(1);
}

/**
 * The env every child CLI runs with. Mirrors `@auxx/sdk`'s env.ts resolution
 * ORDER — an explicit `AUXX_API_URL` still wins — but pins `AUXX_ENV` so the
 * target is this flag's decision and not the shell's.
 */
const TARGET_API = PROD
  ? process.env.AUXX_API_URL || 'https://api.auxx.ai'
  : process.env.AUXX_API_URL || 'http://localhost:3007';

const CHILD_ENV = {
  ...process.env,
  AUXX_ENV: PROD ? 'production' : 'development',
  AUXX_API_URL: TARGET_API,
};

// Pinning AUXX_ENV protects a LOCAL run from a stale shell variable — but it
// would also quietly downgrade a deliberately-configured production run (CI
// exports AUXX_ENV=production) to development, and then fall back to
// localhost:3007 if AUXX_API_URL happened to be empty. Neither guess is
// acceptable, so a disagreement is an error, not a silent choice.
if (!PROD && process.env.AUXX_ENV === 'production') {
  process.stderr.write(
    'AUXX_ENV=production is set, but --prod was not passed — refusing to guess.\n' +
      'Use `pnpm push-prod` to publish to production, or unset AUXX_ENV for a local run.\n',
  );
  process.exit(1);
}

/**
 * Auth, once, before the loop. An unauthenticated CLI prints
 * "You need to log in with Auxx. Press Enter to continue..." and BLOCKS on
 * stdin — and every child here has piped stdio, so 20 of them wait forever on
 * a prompt nobody can answer. That is indistinguishable from "the script did
 * nothing", which is exactly how it was found.
 */
async function assertLoggedIn(): Promise<void> {
  // `whoami` is the wrong probe for a developer API key: it asks better-auth's
  // OAuth `userinfo` endpoint on the APP host, and a `auxx_dev_` key is not an
  // access token — it 401s while every deploy call it fronts succeeds. With a
  // key set, skip the probe; a genuinely bad key then fails per app, loudly,
  // with the API's own error attached.
  if (process.env.AUXX_API_KEY) return;

  // `whoami` prints the account on success. Exit code alone is not enough —
  // see the DEV_ORG branch below for why an exit 0 can mean "did nothing".
  const ok = await new Promise<boolean>((resolve) => {
    let out = '';
    const child = spawn('npx', ['auxx', 'whoami'], {
      cwd: join(APPS_DIR, listApps()[0] ?? '.'),
      env: CHILD_ENV,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0 && !/need to log in/i.test(out)));
  });
  if (ok) return;
  process.stderr.write(`\u2716 Not logged in to ${TARGET_API}.\n`);
  process.stderr.write(
    'Set AUXX_API_KEY (headless — the CLI sends it as the bearer, skipping the keychain),\n' +
      'or run `npx auxx login` in an app directory first, then re-run.\n',
  );
  process.exit(1);
}

/**
 * One reachability check before 20 uploads. Without it a stopped local API
 * fails every app in turn with a connection error, which reads like 20 broken
 * apps. Skipped for `--check`, which never leaves the machine.
 */
async function assertTargetReachable(): Promise<void> {
  try {
    const response = await fetch(`${TARGET_API}/health`);
    if (response.ok) return;
    process.stderr.write(`✖ ${TARGET_API}/health answered ${response.status}.\n`);
  } catch (error) {
    process.stderr.write(
      `✖ Cannot reach ${TARGET_API} — ${error instanceof Error ? error.message : String(error)}\n`,
    );
  }
  process.stderr.write(
    PROD
      ? 'Check the URL and your network, then re-run.\n'
      : 'Start the platform first (`pnpm dev` in ~/Sites/auxxai), then re-run.\n',
  );
  process.exit(1);
}

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

type Outcome = 'published' | 'skipped' | 'ok' | 'failed';
interface PushResult {
  app: string;
  version?: string;
  outcome: Outcome;
  detail?: string;
}

/** App directories to publish — every `apps/<slug>` with a package.json, minus scaffolds/fixtures. */
function listApps(): string[] {
  return readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !SKIP.has(e.name))
    .filter((e) => existsSync(join(APPS_DIR, e.name, 'package.json')))
    .map((e) => e.name)
    .sort();
}

/**
 * Run one app through the public CLI and classify the outcome.
 * `--check` runs `auxx build` (validate only); otherwise `auxx version create --publish`.
 */
function pushApp(app: string): Promise<PushResult> {
  return new Promise((resolve) => {
    const command = CHECK
      ? ['auxx', 'build']
      : DEV_ORG
        ? ['auxx', 'dev', '--once', '-o', DEV_ORG]
        : ['auxx', 'version', 'create', '--publish'];
    const child = spawn('npx', command, {
      cwd: join(APPS_DIR, app),
      env: CHILD_ENV,
      // stdin CLOSED, never a pipe: a CLI that decides to prompt (login,
      // organization choice) must fail fast here, not wait forever on input
      // that can never arrive.
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.stderr.on('data', (d) => {
      err += d.toString();
    });
    child.on('error', (e) => {
      resolve({ app, outcome: 'failed', detail: e.message });
    });
    child.on('close', (code) => {
      const clean = out.replace(ANSI, '');
      const cleanErr = err.replace(ANSI, '');
      if (code !== 0) {
        // A deployment already in review isn't a failure — the prior version is
        // still queued, so there's nothing to publish. Skip instead of failing CI.
        if (/already in review for this app/.test(clean + cleanErr)) {
          const created = /Deployment (\S+) created/.exec(clean);
          resolve({ app, version: created?.[1], outcome: 'skipped', detail: 'already in review' });
          return;
        }
        // Keep the full build output — TS/esbuild errors are multi-line boxes;
        // a last-line heuristic just captures box-drawing. Printed in full below.
        const detail = [clean.trim(), cleanErr.trim()].filter(Boolean).join('\n');
        resolve({ app, outcome: 'failed', detail: detail || `exited with code ${code}` });
        return;
      }
      if (CHECK) {
        resolve({ app, outcome: 'ok' });
        return;
      }
      if (DEV_ORG) {
        // Exit 0 is NOT evidence. An unauthenticated CLI used to print its
        // login prompt, wait on a stdin that never speaks, and exit 0 having
        // deployed nothing — which this script happily reported as 20 apps
        // published. Require the line the deploy actually prints.
        if (/Development deployment created/.test(clean)) {
          resolve({ app, outcome: 'published' });
        } else {
          resolve({
            app,
            outcome: 'failed',
            detail: [clean.trim(), cleanErr.trim()].filter(Boolean).join('\n') ||
              'exited 0 without creating a deployment',
          });
        }
        return;
      }
      const skipped = /Unchanged — skipped \(([^)]+)\)/.exec(clean);
      const created = /Deployment (\S+) created/.exec(clean);
      if (skipped) {
        resolve({ app, version: skipped[1], outcome: 'skipped' });
      } else if (created) {
        resolve({ app, version: created[1], outcome: 'published' });
      } else {
        // Exit 0 but neither marker matched (e.g. submitted-for-review) — surface raw tail.
        resolve({
          app,
          outcome: 'published',
          detail: clean.trim().split('\n').filter(Boolean).pop(),
        });
      }
    });
  });
}

/** Run `worker` over `items` with at most `limit` concurrent in-flight, preserving input order. */
async function runPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function drain(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, drain));
  return results;
}

const ICON: Record<Outcome, string> = { published: '✓', skipped: '○', ok: '✓', failed: '✖' };

async function main(): Promise<void> {
  const apps = listApps();
  if (apps.length === 0) {
    process.stdout.write('No apps found.\n');
    return;
  }

  if (!CHECK) {
    await assertTargetReachable();
    await assertLoggedIn();
  }

  const verb = CHECK ? 'Checking' : DEV_ORG ? 'Dev-deploying' : 'Publishing';
  const where = CHECK
    ? ''
    : DEV_ORG
      ? ` to ${DEV_ORG} on ${TARGET_API}`
      : ` to ${PROD ? 'PRODUCTION' : 'local dev'} (${TARGET_API})`;
  process.stdout.write(
    `${verb} ${apps.length} apps${where} (concurrency ${CONCURRENCY})...\n\n`,
  );

  const results = await runPool(apps, CONCURRENCY, async (app) => {
    const r = await pushApp(app);
    process.stdout.write(`${ICON[r.outcome]} ${app}${r.version ? ` ${r.version}` : ''}\n`);
    return r;
  });

  const pad = Math.max(...results.map((r) => r.app.length));
  process.stdout.write('\nSummary\n');
  for (const r of results) {
    const note = r.outcome === 'skipped' && r.detail ? ` — ${r.detail}` : '';
    const label =
      r.outcome === 'failed'
        ? 'failed'
        : `${r.outcome}${r.version ? ` (${r.version})` : ''}${note}`;
    process.stdout.write(`  ${ICON[r.outcome]} ${r.app.padEnd(pad)}  ${label}\n`);
  }

  // Full output for each failure — this is what you actually need to fix them.
  const failures = results.filter((r) => r.outcome === 'failed');
  for (const r of failures) {
    process.stdout.write(`\n${'─'.repeat(60)}\n✖ ${r.app}\n${'─'.repeat(60)}\n${r.detail}\n`);
  }

  const count = (o: Outcome) => results.filter((r) => r.outcome === o).length;
  const failed = failures.length;
  const tally = CHECK
    ? `${count('ok')} ok · ${failed} failed`
    : `${count('published')} published · ${count('skipped')} skipped · ${failed} failed`;
  process.stdout.write(`\n${tally}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main();

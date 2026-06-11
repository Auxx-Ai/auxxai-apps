// scripts/push-all.ts
// Batch-publish every first-party app in this monorepo through the public auxx
// CLI (`auxx version create --publish`). Private internal tooling — deliberately
// NOT part of @auxx/sdk's public surface. Unchanged apps are skipped server-side
// (idempotent deploy), so re-running this is cheap: one local bundle pass each.
//
// Pass `--check` for a dry run: builds every app (`auxx build` — type-check +
// bundle, no upload/publish) and reports which ones break, so you can fix
// failures before publishing. `pnpm check-all` is the alias.

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPS_DIR = join(ROOT, 'apps');
const SKIP = new Set(['__template', 'test']);
const CONCURRENCY = 3;
const CHECK = process.argv.includes('--check');

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
    const command = CHECK ? ['auxx', 'build'] : ['auxx', 'version', 'create', '--publish'];
    const child = spawn('npx', command, {
      cwd: join(APPS_DIR, app),
      env: process.env,
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
      if (code !== 0) {
        // Keep the full build output — TS/esbuild errors are multi-line boxes;
        // a last-line heuristic just captures box-drawing. Printed in full below.
        const detail = [clean.trim(), err.replace(ANSI, '').trim()].filter(Boolean).join('\n');
        resolve({ app, outcome: 'failed', detail: detail || `exited with code ${code}` });
        return;
      }
      if (CHECK) {
        resolve({ app, outcome: 'ok' });
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

  const verb = CHECK ? 'Checking' : 'Publishing';
  process.stdout.write(`${verb} ${apps.length} apps (concurrency ${CONCURRENCY})...\n\n`);

  const results = await runPool(apps, CONCURRENCY, async (app) => {
    const r = await pushApp(app);
    process.stdout.write(`${ICON[r.outcome]} ${app}${r.version ? ` ${r.version}` : ''}\n`);
    return r;
  });

  const pad = Math.max(...results.map((r) => r.app.length));
  process.stdout.write('\nSummary\n');
  for (const r of results) {
    const label =
      r.outcome === 'failed' ? 'failed' : `${r.outcome}${r.version ? ` (${r.version})` : ''}`;
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

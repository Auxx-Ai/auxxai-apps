// src/github-issues.connector.server.ts
//
// Server handler for the GitHub Issues connector. Runs inside the app-runtime
// sandbox: fetches ONE page of issues from the REST /issues endpoint using the
// bound connection, and returns the page's records + a flat `page=N` cursor. The
// platform (Step 11 adapter) wraps that cursor into a resume checkpoint and
// re-invokes for the next page until `backfillComplete`.
//
// Why raw `fetch` (not the shared `githubApi` helper): that helper returns parsed
// JSON with no response headers, but pagination needs the `Link` header's
// `rel="next"` page number — same constraint the Shopify connector documents.
//
// Connection contract: a connector resolves its connection from `args.connection`
// (NOT the ambient tool `getOrganizationConnection()` helper) — `value` is the
// GitHub access token. Issues are paged oldest-`updated_at`-first so the last item
// is the high-water mark and `since` gives a true incremental floor.

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'

const GITHUB_API = 'https://api.github.com'
const PAGE_SIZE = 100

interface GithubConfig {
  /** `<owner>/<repo>` full-name picked from the config dropdown. */
  repo?: string
}

/**
 * Split a `<owner>/<repo>` full-name into parts. Throws on empty/malformed config —
 * a connector with no repo MUST fail fast, never silently sync a default public repo.
 */
function parseRepo(fullName: string | undefined): { owner: string; repo: string } {
  const [owner, repo] = (fullName ?? '').trim().split('/')
  if (!owner || !repo) {
    throw new Error('github.issues: repo required (expected "<owner>/<repo>")')
  }
  return { owner, repo }
}

/**
 * Parse GitHub's throttle headers into a wait (ms) when a response indicates a rate
 * limit. GitHub signals primary limits as 403 with `x-ratelimit-remaining: 0` (wait
 * until `x-ratelimit-reset`, epoch seconds) and secondary limits as 403/429 with a
 * `Retry-After` (seconds). Returns null when the response is not a rate limit.
 */
function parseRateLimit(res: Response): { retryAfterMs?: number } | null {
  const retryAfter = res.headers.get('Retry-After')
  if (retryAfter) {
    const secs = Number.parseInt(retryAfter, 10)
    if (Number.isFinite(secs)) return { retryAfterMs: secs * 1000 }
  }
  const remaining = res.headers.get('x-ratelimit-remaining')
  const reset = res.headers.get('x-ratelimit-reset')
  if ((res.status === 403 || res.status === 429) && remaining === '0' && reset) {
    const resetMs = Number.parseInt(reset, 10) * 1000
    if (Number.isFinite(resetMs)) return { retryAfterMs: Math.max(0, resetMs - Date.now()) }
  }
  if (res.status === 429) return {}
  return null
}

interface RawIssue {
  id: number
  number: number
  title: string | null
  state: string
  body: string | null
  user: { login: string } | null
  comments: number
  html_url: string
  created_at: string
  updated_at: string
}

/** Project one REST issue into a SOURCE-shaped record (fields keyed by sourcePath). */
function toRecord(issue: RawIssue): ConnectorRecord {
  return {
    streamKey: 'issue',
    externalId: String(issue.id),
    displayName: issue.title ?? `#${issue.number}`,
    fields: {
      id: String(issue.id),
      number: issue.number,
      title: issue.title,
      state: issue.state,
      body: issue.body,
      author: issue.user?.login ?? null,
      comments: issue.comments,
      url: issue.html_url,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    },
  }
}

/** Extract the `page` number of the `rel="next"` link from a Link header. */
function nextPage(linkHeader: string | null): string | undefined {
  return linkHeader?.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="next"/)?.[1]
}

export default async function githubIssuesSync(
  args: ConnectorExecuteArgs<GithubConfig>
): Promise<ConnectorFetchResult> {
  const { streamKey, mode, state, connection, config } = args

  if (streamKey !== 'issue') {
    throw new Error(`github.issues: unknown stream "${streamKey}"`)
  }
  if (!connection?.value) {
    throw new Error('github.issues: missing connection (requiresConnection)')
  }
  const token = connection.value
  const { owner, repo } = parseRepo(config.repo)

  // Page oldest-`updated_at`-first so the last issue on the last page is the
  // high-water mark; `since` filters incremental runs to that floor.
  const params = new URLSearchParams({
    state: 'all',
    sort: 'updated',
    direction: 'asc',
    per_page: String(PAGE_SIZE),
    page: state.cursor ? String(state.cursor) : '1',
  })
  if (mode === 'incremental' && state.updatedSince) {
    params.set('since', String(state.updatedSince))
  }

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'auxx-github-connector',
    },
  })
  if (!res.ok) {
    // Throttled → RETURN the signal (don't throw, don't sleep). The platform pauses
    // the chain and re-enqueues after the wait; we hold the current page cursor so the
    // throttled page is retried, not skipped.
    const rateLimited = parseRateLimit(res)
    if (rateLimited) {
      return {
        records: [],
        nextState: { cursor: state.cursor, updatedSince: state.updatedSince },
        rateLimited,
      }
    }
    throw new Error(`github.issues: REST API responded ${res.status}`)
  }

  const issues = (await res.json()) as RawIssue[]
  const next = nextPage(res.headers.get('Link'))
  // Ascending `updated_at` → the last issue carries the high-water mark.
  const lastUpdated = issues[issues.length - 1]?.updated_at ?? state.updatedSince

  return {
    records: issues.map(toRecord),
    nextState: next
      ? // More pages in this chain — advance the page cursor, hold the watermark.
        { cursor: next, updatedSince: state.updatedSince }
      : // Chain done — drop the cursor, advance the watermark for the next run.
        { cursor: undefined, updatedSince: lastUpdated, backfillComplete: true },
  }
}

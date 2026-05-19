// src/tools/summarize-recent-prs.tool.server.ts

import { githubGraphql } from '../blocks/github/shared/github-graphql'
import { buildPrSearchQuery } from './shared/build-search-query'
import { getGithubConnection } from './shared/connection'
import {
  mapPrDetail,
  type CheckRollupState,
  type MappedReview,
  type PrNode,
  type ReviewState,
} from './shared/map-pr'
import { GET_PR_COMPOSITE_QUERY, SEARCH_PRS_QUERY } from './shared/queries'

interface SummarizeRecentPrsInput {
  owner?: string
  repo?: string
  state?: 'open' | 'closed' | 'merged' | 'all'
  since?: string
  limit?: number
  includeChecks?: boolean
}

interface TrimmedPr {
  repoFullName: string
  prNumber: number
  title: string
  state: 'open' | 'closed' | 'merged'
  isDraft: boolean
  author: string | null
  headRef: string
  baseRef: string
  url: string
  updatedAt: string
  additions: number
  deletions: number
  changedFiles: number
  requestedReviewers: string[]
  topReviews: { author: string | null; state: ReviewState; submittedAt: string | null }[]
  checksState: CheckRollupState | null
  checksSummary: string | null
}

interface SummarizeRecentPrsOutput {
  summary: string
  pullRequests: TrimmedPr[]
}

/**
 * Streaming tool — lists recent PRs via search, then fans out one composite
 * fetch per PR (reuses GET_PR_COMPOSITE_QUERY with `withFiles: false` +
 * trimmed reviews). Yields a progress frame after each fetch and a
 * `phase: 'slow'` frame when the GraphQL rate-limit budget drops below 100.
 * See plans/kopilot/apps/github-overhaul.md §4.11 / §7 / §8 Q3.
 */
export default async function* summarizeRecentPrs(
  input: SummarizeRecentPrsInput
): AsyncGenerator<{ kind: string; data: unknown }, SummarizeRecentPrsOutput, void> {
  const { token } = getGithubConnection()
  const limit = Math.min(input.limit ?? 10, 25)
  const since = input.since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const includeChecks = input.includeChecks ?? true

  yield { kind: 'phase', data: { phase: 'starting', limit } }

  const searchQuery = buildPrSearchQuery({
    owner: input.owner,
    repo: input.repo,
    state: input.state ?? 'open',
    since,
  })

  interface SearchNode extends PrNode {
    repository?: { nameWithOwner?: string | null } | null
  }
  const search = await githubGraphql<{
    search: { issueCount: number; nodes: (SearchNode | null)[] }
  }>(SEARCH_PRS_QUERY, { query: searchQuery, limit }, token)

  const candidates = (search.data.search?.nodes ?? []).filter(Boolean) as SearchNode[]
  yield { kind: 'phase', data: { phase: 'found', total: candidates.length } }

  if (candidates.length === 0) {
    return {
      summary: 'No pull requests matched the requested window.',
      pullRequests: [],
    }
  }

  const trimmed: TrimmedPr[] = []
  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i]
    if (!cand) continue
    const repoFullName = cand.repository?.nameWithOwner ?? ''
    const [owner, repo] = repoFullName.split('/')
    if (!owner || !repo) continue

    yield {
      kind: 'phase',
      data: {
        phase: 'fetching',
        idx: i + 1,
        total: candidates.length,
        prNumber: cand.number,
        title: cand.title,
      },
    }

    const composite = await githubGraphql<{
      repository: { pullRequest: Parameters<typeof mapPrDetail>[0] | null } | null
    }>(
      GET_PR_COMPOSITE_QUERY,
      {
        owner,
        repo,
        number: cand.number ?? 0,
        reviewsLimit: 5,
        withReviews: true,
        withChecks: includeChecks,
        withFiles: false,
      },
      token
    )

    const raw = composite.data.repository?.pullRequest
    if (!raw) continue
    const detail = mapPrDetail(raw)
    detail.reviews.reverse()

    trimmed.push({
      repoFullName,
      prNumber: detail.prNumber,
      title: detail.title,
      state: detail.state,
      isDraft: detail.isDraft,
      author: detail.author,
      headRef: detail.headRef,
      baseRef: detail.baseRef,
      url: detail.url,
      updatedAt: detail.updatedAt,
      additions: detail.additions,
      deletions: detail.deletions,
      changedFiles: detail.changedFiles,
      requestedReviewers: detail.requestedReviewers,
      topReviews: detail.reviews.slice(0, 5).map((r: MappedReview) => ({
        author: r.author,
        state: r.state,
        submittedAt: r.submittedAt,
      })),
      checksState: detail.checks?.state ?? null,
      checksSummary: detail.checks?.summary ?? null,
    })

    if (composite.rateLimit && composite.rateLimit.remaining < 100) {
      yield {
        kind: 'phase',
        data: {
          phase: 'slow',
          remaining: composite.rateLimit.remaining,
          resetAt: composite.rateLimit.resetAt,
        },
      }
    }

    yield {
      kind: 'phase',
      data: {
        phase: 'fetched',
        idx: i + 1,
        total: candidates.length,
        prNumber: detail.prNumber,
      },
    }
  }

  return { summary: buildSummary(trimmed), pullRequests: trimmed }
}

function buildSummary(prs: TrimmedPr[]): string {
  if (prs.length === 0) return 'No pull requests matched the requested window.'

  const open = prs.filter((p) => p.state === 'open').length
  const merged = prs.filter((p) => p.state === 'merged').length
  const closed = prs.filter((p) => p.state === 'closed').length
  const draft = prs.filter((p) => p.isDraft).length

  const reviewerCounts = new Map<string, number>()
  for (const p of prs) {
    if (p.state !== 'open') continue
    for (const r of p.requestedReviewers) {
      reviewerCounts.set(r, (reviewerCounts.get(r) ?? 0) + 1)
    }
  }
  const topPending = [...reviewerCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([login, count]) => `${login} (${count})`)
    .join(', ')

  const checkCounts = new Map<string, number>()
  for (const p of prs) {
    if (!p.checksState) continue
    checkCounts.set(p.checksState, (checkCounts.get(p.checksState) ?? 0) + 1)
  }
  const checkBreakdown = [...checkCounts.entries()]
    .map(([k, v]) => `${v} ${k.toLowerCase()}`)
    .join(', ')

  const openSortedByAge = prs
    .filter((p) => p.state === 'open')
    .sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : 1))
  const oldest = openSortedByAge[0]

  const parts: string[] = [
    `${prs.length} PRs — ${open} open${draft ? ` (${draft} draft)` : ''}, ${merged} merged, ${closed} closed.`,
  ]
  if (topPending) parts.push(`Top pending reviewers: ${topPending}.`)
  if (checkBreakdown) parts.push(`Checks: ${checkBreakdown}.`)
  if (oldest)
    parts.push(`Oldest open: #${oldest.prNumber} "${oldest.title}" (${oldest.updatedAt}).`)

  return parts.join(' ')
}

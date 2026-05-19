// src/tools/shared/map-pr.ts

/**
 * GraphQL `PullRequest` node → chat-tool shape. See plan §7. The composite
 * detail mapper handles reviews + check status + file diffs in a single
 * pass, mirroring the GET_PR_COMPOSITE query — REST would need 3+ calls.
 */

export type PrState = 'open' | 'closed' | 'merged'
export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING'

export interface MappedPrSummary {
  prNumber: number
  title: string
  state: PrState
  isDraft: boolean
  author: string | null
  headRef: string
  baseRef: string
  url: string
  createdAt: string
  updatedAt: string
  labels: string[]
  assignees: string[]
  requestedReviewers: string[]
}

export interface MappedReview {
  reviewId: string
  author: string | null
  state: ReviewState
  body: string | null
  submittedAt: string | null
  url: string
}

export type CheckRollupState =
  | 'SUCCESS'
  | 'FAILURE'
  | 'PENDING'
  | 'NEUTRAL'
  | 'CANCELLED'
  | 'TIMED_OUT'
  | 'ACTION_REQUIRED'
  | 'SKIPPED'
  | 'EXPECTED'

export interface MappedCheckRun {
  name: string
  conclusion: string | null
  url: string | null
}

export interface MappedChecks {
  state: CheckRollupState | null
  summary: string
  runs: MappedCheckRun[]
}

export interface MappedFile {
  path: string
  additions: number
  deletions: number
  status: 'ADDED' | 'MODIFIED' | 'REMOVED' | 'RENAMED' | 'COPIED' | 'CHANGED'
}

export interface MappedPrDetail extends MappedPrSummary {
  body: string | null
  mergedAt: string | null
  mergedBy: string | null
  commentsCount: number
  additions: number
  deletions: number
  changedFiles: number
  reviews: MappedReview[]
  checks: MappedChecks | null
  files: MappedFile[]
}

export interface PrNode {
  number?: number | null
  title?: string | null
  state?: string | null
  isDraft?: boolean | null
  author?: { login?: string | null } | null
  headRefName?: string | null
  baseRefName?: string | null
  url?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  body?: string | null
  labels?: { nodes?: ({ name?: string | null } | null)[] | null } | null
  assignees?: { nodes?: ({ login?: string | null } | null)[] | null } | null
  reviewRequests?: {
    nodes?:
      | ({
          requestedReviewer?:
            | { login?: string | null; combinedSlug?: string | null }
            | null
            | undefined
        } | null)[]
      | null
  } | null
}

export interface PrCompositeNode extends PrNode {
  mergedAt?: string | null
  mergedBy?: { login?: string | null } | null
  additions?: number | null
  deletions?: number | null
  changedFiles?: number | null
  comments?: { totalCount?: number | null } | null
  reviews?: { nodes?: (RawReviewNode | null)[] | null } | null
  commits?: {
    nodes?:
      | ({
          commit?: {
            statusCheckRollup?: {
              state?: string | null
              contexts?: { nodes?: (RawCheckContext | null)[] | null } | null
            } | null
          } | null
        } | null)[]
      | null
  } | null
  files?: { nodes?: (RawFileNode | null)[] | null } | null
}

interface RawReviewNode {
  id?: string | null
  author?: { login?: string | null } | null
  state?: string | null
  body?: string | null
  submittedAt?: string | null
  url?: string | null
}

interface RawCheckContext {
  __typename?: string | null
  name?: string | null
  conclusion?: string | null
  detailsUrl?: string | null
  context?: string | null
  state?: string | null
  targetUrl?: string | null
}

interface RawFileNode {
  path?: string | null
  additions?: number | null
  deletions?: number | null
  changeType?: string | null
}

const PR_STATES = new Set(['open', 'closed', 'merged'])
const REVIEW_STATES = new Set([
  'APPROVED',
  'CHANGES_REQUESTED',
  'COMMENTED',
  'DISMISSED',
  'PENDING',
])
const ROLLUP_STATES = new Set([
  'SUCCESS',
  'FAILURE',
  'PENDING',
  'NEUTRAL',
  'CANCELLED',
  'TIMED_OUT',
  'ACTION_REQUIRED',
  'SKIPPED',
  'EXPECTED',
])
const FILE_STATUSES = new Set(['ADDED', 'MODIFIED', 'REMOVED', 'RENAMED', 'COPIED', 'CHANGED'])

export function mapPrSummary(node: PrNode): MappedPrSummary {
  const state = (node.state ?? 'OPEN').toLowerCase()
  return {
    prNumber: node.number ?? 0,
    title: node.title ?? '',
    state: (PR_STATES.has(state) ? state : 'open') as PrState,
    isDraft: Boolean(node.isDraft),
    author: node.author?.login ?? null,
    headRef: node.headRefName ?? '',
    baseRef: node.baseRefName ?? '',
    url: node.url ?? '',
    createdAt: node.createdAt ?? '',
    updatedAt: node.updatedAt ?? '',
    labels:
      node.labels?.nodes?.map((n) => n?.name ?? '').filter((n): n is string => Boolean(n)) ?? [],
    assignees:
      node.assignees?.nodes?.map((n) => n?.login ?? '').filter((n): n is string => Boolean(n)) ??
      [],
    requestedReviewers:
      node.reviewRequests?.nodes
        ?.map((rr) => rr?.requestedReviewer?.login ?? rr?.requestedReviewer?.combinedSlug ?? '')
        .filter((n): n is string => Boolean(n)) ?? [],
  }
}

export function mapPrDetail(node: PrCompositeNode): MappedPrDetail {
  return {
    ...mapPrSummary(node),
    body: node.body ?? null,
    mergedAt: node.mergedAt ?? null,
    mergedBy: node.mergedBy?.login ?? null,
    commentsCount: node.comments?.totalCount ?? 0,
    additions: node.additions ?? 0,
    deletions: node.deletions ?? 0,
    changedFiles: node.changedFiles ?? 0,
    reviews: (node.reviews?.nodes ?? []).filter(Boolean).map((r) => mapReview(r as RawReviewNode)),
    checks: mapChecks(node),
    files: (node.files?.nodes ?? []).filter(Boolean).map((f) => mapFile(f as RawFileNode)),
  }
}

function mapReview(node: RawReviewNode): MappedReview {
  const state = node.state ?? 'PENDING'
  return {
    reviewId: node.id ?? '',
    author: node.author?.login ?? null,
    state: (REVIEW_STATES.has(state) ? state : 'PENDING') as ReviewState,
    body: node.body ?? null,
    submittedAt: node.submittedAt ?? null,
    url: node.url ?? '',
  }
}

function mapChecks(node: PrCompositeNode): MappedChecks | null {
  const rollup = node.commits?.nodes?.[0]?.commit?.statusCheckRollup
  if (!rollup) return null
  const contexts = (rollup.contexts?.nodes ?? []).filter(Boolean) as RawCheckContext[]
  const runs: MappedCheckRun[] = contexts.map((c) => ({
    name: c.name ?? c.context ?? 'check',
    conclusion: c.conclusion ?? c.state ?? null,
    url: c.detailsUrl ?? c.targetUrl ?? null,
  }))

  const counts = new Map<string, number>()
  for (const r of runs) {
    const key = (r.conclusion ?? 'PENDING').toUpperCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const passed = counts.get('SUCCESS') ?? 0
  const failed = (counts.get('FAILURE') ?? 0) + (counts.get('TIMED_OUT') ?? 0)
  const failures = runs
    .filter((r) => {
      const k = (r.conclusion ?? '').toUpperCase()
      return k === 'FAILURE' || k === 'TIMED_OUT'
    })
    .map((r) => r.name)
    .slice(0, 5)
  const parts: string[] = []
  if (passed) parts.push(`${passed} passed`)
  if (failed) parts.push(`${failed} failed${failures.length ? ` (${failures.join(', ')})` : ''}`)
  for (const [state, n] of counts.entries()) {
    if (state !== 'SUCCESS' && state !== 'FAILURE' && state !== 'TIMED_OUT') {
      parts.push(`${n} ${state.toLowerCase()}`)
    }
  }
  const summary = parts.length > 0 ? parts.join(', ') : 'No checks reported.'

  const rollupState = (rollup.state ?? '').toUpperCase()
  return {
    state: (ROLLUP_STATES.has(rollupState) ? rollupState : null) as CheckRollupState | null,
    summary,
    runs,
  }
}

function mapFile(node: RawFileNode): MappedFile {
  const status = (node.changeType ?? 'MODIFIED').toUpperCase()
  return {
    path: node.path ?? '',
    additions: node.additions ?? 0,
    deletions: node.deletions ?? 0,
    status: (FILE_STATUSES.has(status) ? status : 'MODIFIED') as MappedFile['status'],
  }
}

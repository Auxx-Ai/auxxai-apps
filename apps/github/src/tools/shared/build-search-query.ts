// src/tools/shared/build-search-query.ts

/**
 * GitHub `search()` queries use a single `q:` DSL string. The chat tool
 * surface exposes structured zod inputs; this helper translates them into the
 * DSL clauses GitHub expects. Power users (and chained LLM calls) can still
 * pass a free-text `q` that gets concatenated alongside the structured
 * clauses — see plan §8 Q6.
 *
 * Clauses are space-joined (implicit AND). Repeated qualifiers (labels) are
 * emitted once per value.
 */

export interface IssueSearchFilters {
  owner?: string
  repo?: string
  q?: string
  state?: 'open' | 'closed' | 'all'
  labels?: string[]
  assignee?: string
  author?: string
  since?: string
}

export function buildIssueSearchQuery(input: IssueSearchFilters): string {
  const parts: string[] = ['is:issue']
  if (input.owner && input.repo) parts.push(`repo:${input.owner}/${input.repo}`)
  else if (input.owner) parts.push(`user:${input.owner}`)
  if (input.state && input.state !== 'all') parts.push(`is:${input.state}`)
  if (input.labels) for (const l of input.labels) parts.push(`label:${quote(l)}`)
  if (input.assignee) parts.push(`assignee:${input.assignee}`)
  if (input.author) parts.push(`author:${input.author}`)
  if (input.since) parts.push(`updated:>=${input.since}`)
  if (input.q) parts.push(input.q)
  return parts.join(' ')
}

export interface PrSearchFilters {
  owner?: string
  repo?: string
  q?: string
  state?: 'open' | 'closed' | 'merged' | 'all'
  author?: string
  assignee?: string
  reviewRequested?: string
  reviewedBy?: string
  baseRef?: string
  since?: string
}

export function buildPrSearchQuery(input: PrSearchFilters): string {
  const parts: string[] = ['is:pr']
  if (input.owner && input.repo) parts.push(`repo:${input.owner}/${input.repo}`)
  else if (input.owner) parts.push(`user:${input.owner}`)
  if (input.state && input.state !== 'all') {
    if (input.state === 'merged') parts.push('is:merged')
    else parts.push(`is:${input.state}`)
  }
  if (input.author) parts.push(`author:${input.author}`)
  if (input.assignee) parts.push(`assignee:${input.assignee}`)
  if (input.reviewRequested) parts.push(`review-requested:${input.reviewRequested}`)
  if (input.reviewedBy) parts.push(`reviewed-by:${input.reviewedBy}`)
  if (input.baseRef) parts.push(`base:${input.baseRef}`)
  if (input.since) parts.push(`updated:>=${input.since}`)
  if (input.q) parts.push(input.q)
  return parts.join(' ')
}

function quote(value: string): string {
  return /\s/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value
}

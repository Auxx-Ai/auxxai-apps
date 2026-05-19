// src/tools/search-github-pull-requests.tool.server.ts

import { githubGraphql } from '../blocks/github/shared/github-graphql'
import { buildPrSearchQuery } from './shared/build-search-query'
import { getGithubConnection } from './shared/connection'
import { mapPrSummary, type MappedPrSummary, type PrNode } from './shared/map-pr'
import { SEARCH_PRS_QUERY } from './shared/queries'

interface SearchGithubPullRequestsInput {
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
  limit?: number
}

interface SearchGithubPullRequestsOutput {
  pullRequests: (Omit<MappedPrSummary, 'createdAt' | 'assignees'> & { repoFullName: string })[]
  truncated: boolean
}

interface PrSearchNode extends PrNode {
  repository?: { nameWithOwner?: string | null } | null
}

export default async function searchGithubPullRequests(
  input: SearchGithubPullRequestsInput
): Promise<SearchGithubPullRequestsOutput> {
  const { token } = getGithubConnection()
  const limit = Math.min(input.limit ?? 25, 50)
  const query = buildPrSearchQuery(input)

  const { data } = await githubGraphql<{
    search: { issueCount: number; nodes: (PrSearchNode | null)[] }
  }>(SEARCH_PRS_QUERY, { query, limit }, token)

  const nodes = (data.search?.nodes ?? []).filter(Boolean) as PrSearchNode[]
  const pullRequests = nodes.map((node) => {
    const summary = mapPrSummary(node)
    return {
      repoFullName: node.repository?.nameWithOwner ?? '',
      prNumber: summary.prNumber,
      title: summary.title,
      state: summary.state,
      isDraft: summary.isDraft,
      author: summary.author,
      headRef: summary.headRef,
      baseRef: summary.baseRef,
      url: summary.url,
      updatedAt: summary.updatedAt,
      labels: summary.labels,
      requestedReviewers: summary.requestedReviewers,
    }
  })
  const truncated = (data.search?.issueCount ?? pullRequests.length) > pullRequests.length

  return { pullRequests, truncated }
}

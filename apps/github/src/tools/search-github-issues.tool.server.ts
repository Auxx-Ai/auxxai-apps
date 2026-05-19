// src/tools/search-github-issues.tool.server.ts

import { githubGraphql } from '../blocks/github/shared/github-graphql'
import { buildIssueSearchQuery } from './shared/build-search-query'
import { getGithubConnection } from './shared/connection'
import { mapIssueSummary, type IssueNode, type MappedIssueSummary } from './shared/map-issue'
import { SEARCH_ISSUES_QUERY } from './shared/queries'

interface SearchGithubIssuesInput {
  owner?: string
  repo?: string
  q?: string
  state?: 'open' | 'closed' | 'all'
  labels?: string[]
  assignee?: string
  author?: string
  since?: string
  limit?: number
}

interface SearchGithubIssuesOutput {
  issues: (MappedIssueSummary & { repoFullName: string })[]
  truncated: boolean
}

interface IssueSearchNode extends IssueNode {
  repository?: { nameWithOwner?: string | null } | null
}

export default async function searchGithubIssues(
  input: SearchGithubIssuesInput
): Promise<SearchGithubIssuesOutput> {
  const { token } = getGithubConnection()
  const limit = Math.min(input.limit ?? 25, 50)
  const query = buildIssueSearchQuery(input)

  const { data } = await githubGraphql<{
    search: { issueCount: number; nodes: (IssueSearchNode | null)[] }
  }>(SEARCH_ISSUES_QUERY, { query, limit }, token)

  const nodes = (data.search?.nodes ?? []).filter(Boolean) as IssueSearchNode[]
  const issues = nodes.map((node) => ({
    ...mapIssueSummary(node),
    repoFullName: node.repository?.nameWithOwner ?? '',
  }))
  const truncated = (data.search?.issueCount ?? issues.length) > issues.length

  return { issues, truncated }
}

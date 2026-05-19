// src/tools/search-github-repos.tool.server.ts

import { githubGraphql } from '../blocks/github/shared/github-graphql'
import { getGithubConnection } from './shared/connection'
import { mapRepoSummary, type MappedRepoSummary } from './shared/map-repo'
import { SEARCH_REPOS_QUERY } from './shared/queries'

interface SearchGithubReposInput {
  query: string
  limit?: number
  owner?: string
}

interface SearchGithubReposOutput {
  repos: MappedRepoSummary[]
  truncated: boolean
}

export default async function searchGithubRepos(
  input: SearchGithubReposInput
): Promise<SearchGithubReposOutput> {
  const { token } = getGithubConnection()
  const limit = Math.min(input.limit ?? 10, 25)

  const qParts = [input.query]
  if (input.owner) qParts.push(`user:${input.owner}`)
  const q = qParts.join(' ')

  const { data } = await githubGraphql<{
    search: { repositoryCount: number; nodes: unknown[] }
  }>(SEARCH_REPOS_QUERY, { query: q, limit }, token)

  const nodes = (data.search?.nodes ?? []).filter(Boolean) as Parameters<typeof mapRepoSummary>[0][]
  const repos = nodes.map(mapRepoSummary)
  const truncated = (data.search?.repositoryCount ?? repos.length) > repos.length

  return { repos, truncated }
}

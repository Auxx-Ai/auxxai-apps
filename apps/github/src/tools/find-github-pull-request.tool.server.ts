// src/tools/find-github-pull-request.tool.server.ts

import { githubGraphql } from '../blocks/github/shared/github-graphql'
import { getGithubConnection } from './shared/connection'
import { mapPrSummary, type MappedPrSummary } from './shared/map-pr'
import { FIND_PR_BY_NUMBER_QUERY, FIND_PR_BY_QUERY } from './shared/queries'

interface FindGithubPullRequestInput {
  owner: string
  repo: string
  prNumber?: number
  titleQuery?: string
}

interface FindGithubPullRequestOutput {
  found: boolean
  pullRequest: Pick<
    MappedPrSummary,
    | 'prNumber'
    | 'title'
    | 'state'
    | 'isDraft'
    | 'author'
    | 'headRef'
    | 'baseRef'
    | 'url'
    | 'createdAt'
    | 'updatedAt'
  > | null
}

export default async function findGithubPullRequest(
  input: FindGithubPullRequestInput
): Promise<FindGithubPullRequestOutput> {
  if (Number(input.prNumber != null) + Number(!!input.titleQuery) !== 1) {
    const err = new Error('Provide exactly one of prNumber or titleQuery.') as Error & {
      code: string
    }
    err.code = 'INVALID_INPUT'
    throw err
  }

  const { token } = getGithubConnection()

  if (input.prNumber != null) {
    const { data } = await githubGraphql<{
      repository: { pullRequest: Parameters<typeof mapPrSummary>[0] | null } | null
    }>(
      FIND_PR_BY_NUMBER_QUERY,
      { owner: input.owner, repo: input.repo, number: input.prNumber },
      token
    )
    const raw = data.repository?.pullRequest
    if (!raw) return { found: false, pullRequest: null }
    return { found: true, pullRequest: trim(mapPrSummary(raw)) }
  }

  const q = `repo:${input.owner}/${input.repo} is:pr in:title ${input.titleQuery}`
  const { data } = await githubGraphql<{ search: { nodes: unknown[] } }>(
    FIND_PR_BY_QUERY,
    { query: q },
    token
  )
  const raw = (data.search?.nodes ?? [])[0] as Parameters<typeof mapPrSummary>[0] | undefined
  if (!raw) return { found: false, pullRequest: null }
  return { found: true, pullRequest: trim(mapPrSummary(raw)) }
}

function trim(pr: MappedPrSummary): FindGithubPullRequestOutput['pullRequest'] {
  const { prNumber, title, state, isDraft, author, headRef, baseRef, url, createdAt, updatedAt } =
    pr
  return { prNumber, title, state, isDraft, author, headRef, baseRef, url, createdAt, updatedAt }
}

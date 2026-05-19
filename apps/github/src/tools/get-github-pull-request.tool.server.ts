// src/tools/get-github-pull-request.tool.server.ts

import { githubGraphql } from '../blocks/github/shared/github-graphql'
import { getGithubConnection } from './shared/connection'
import { mapPrDetail, type MappedPrDetail } from './shared/map-pr'
import { GET_PR_COMPOSITE_QUERY } from './shared/queries'

interface GetGithubPullRequestInput {
  owner: string
  repo: string
  prNumber: number
  includeReviews?: boolean
  includeChecks?: boolean
  includeFiles?: boolean
  reviewsLimit?: number
}

export default async function getGithubPullRequest(
  input: GetGithubPullRequestInput
): Promise<MappedPrDetail> {
  const { token } = getGithubConnection()
  const includeReviews = input.includeReviews ?? true
  const includeChecks = input.includeChecks ?? true
  const includeFiles = input.includeFiles ?? false
  const reviewsLimit = Math.min(input.reviewsLimit ?? 20, 50)

  const { data } = await githubGraphql<{
    repository: { pullRequest: Parameters<typeof mapPrDetail>[0] | null } | null
  }>(
    GET_PR_COMPOSITE_QUERY,
    {
      owner: input.owner,
      repo: input.repo,
      number: input.prNumber,
      reviewsLimit,
      withReviews: includeReviews,
      withChecks: includeChecks,
      withFiles: includeFiles,
    },
    token
  )

  const raw = data.repository?.pullRequest
  if (!raw) {
    const err = new Error(
      `Pull request #${input.prNumber} not found in ${input.owner}/${input.repo}.`
    ) as Error & { code: string }
    err.code = 'NOT_FOUND'
    throw err
  }

  const detail = mapPrDetail(raw)
  // Reviews come back oldest-first from `last:`; flip for most-recent-first.
  detail.reviews.reverse()
  return detail
}

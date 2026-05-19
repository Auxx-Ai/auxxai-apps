// src/tools/review-github-pull-request.tool.server.ts

import { githubApi } from '../blocks/github/shared/github-api'
import { getGithubConnection } from './shared/connection'

interface ReviewGithubPullRequestInput {
  owner: string
  repo: string
  prNumber: number
  event: 'APPROVE' | 'COMMENT'
  body?: string
}

interface ReviewGithubPullRequestOutput {
  reviewId: string
  state: 'APPROVED' | 'COMMENTED'
  submittedAt: string
  url: string
}

interface RestReview {
  id: number
  state: string
  submitted_at: string | null
  html_url: string
}

export default async function reviewGithubPullRequest(
  input: ReviewGithubPullRequestInput
): Promise<ReviewGithubPullRequestOutput> {
  if (input.event === 'COMMENT' && !(input.body ?? '').trim()) {
    const err = new Error('event=COMMENT requires a non-empty body.') as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  }

  const { token } = getGithubConnection()
  const body: Record<string, unknown> = { event: input.event }
  if (input.body) body.body = input.body

  const result = (await githubApi(
    'POST',
    `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/pulls/${input.prNumber}/reviews`,
    token,
    { body }
  )) as RestReview

  const state = (result.state ?? '').toUpperCase() === 'APPROVED' ? 'APPROVED' : 'COMMENTED'
  return {
    reviewId: String(result.id),
    state,
    submittedAt: result.submitted_at ?? new Date().toISOString(),
    url: result.html_url,
  }
}

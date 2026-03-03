import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { githubApi, githubPaginatedGet, throwConnectionNotFound } from '../../shared/github-api'

export async function executeReview(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, string>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const owner = input.owner?.trim()
  const repo = input.repo?.trim()
  if (!owner)
    throw new BlockValidationError([{ field: 'owner', message: 'Repository owner is required.' }])
  if (!repo)
    throw new BlockValidationError([{ field: 'repo', message: 'Repository name is required.' }])

  switch (operation) {
    case 'create': {
      const prNumber = input.createReviewPRNumber?.trim()
      if (!prNumber) {
        throw new BlockValidationError([
          { field: 'createReviewPRNumber', message: 'Pull request number is required.' },
        ])
      }

      const event = input.createReviewEvent
      if (!event) {
        throw new BlockValidationError([
          { field: 'createReviewEvent', message: 'Review action is required.' },
        ])
      }

      const body: Record<string, unknown> = { event }
      if (input.createReviewBody?.trim()) body.body = input.createReviewBody.trim()
      if (input.createReviewCommitId?.trim()) body.commit_id = input.createReviewCommitId.trim()

      if ((event === 'REQUEST_CHANGES' || event === 'COMMENT') && !body.body) {
        throw new BlockValidationError([
          { field: 'createReviewBody', message: 'Review body is required for this action.' },
        ])
      }

      const result = await githubApi(
        'POST',
        `/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
        token,
        { body }
      )

      return {
        reviewId: String(result.id),
        reviewState: result.state ?? '',
        reviewUrl: result.html_url ?? '',
      }
    }

    case 'get': {
      const prNumber = input.getReviewPRNumber?.trim()
      if (!prNumber) {
        throw new BlockValidationError([
          { field: 'getReviewPRNumber', message: 'Pull request number is required.' },
        ])
      }
      const reviewId = input.getReviewId?.trim()
      if (!reviewId) {
        throw new BlockValidationError([
          { field: 'getReviewId', message: 'Review ID is required.' },
        ])
      }

      const result = await githubApi(
        'GET',
        `/repos/${owner}/${repo}/pulls/${prNumber}/reviews/${reviewId}`,
        token
      )

      return {
        reviewId: String(result.id),
        reviewState: result.state ?? '',
        reviewBody: result.body ?? '',
        reviewUser: result.user?.login ?? '',
        reviewUrl: result.html_url ?? '',
        reviewSubmittedAt: result.submitted_at ?? '',
      }
    }

    case 'getMany': {
      const prNumber = input.getManyReviewsPRNumber?.trim()
      if (!prNumber) {
        throw new BlockValidationError([
          { field: 'getManyReviewsPRNumber', message: 'Pull request number is required.' },
        ])
      }

      const { items, totalCount } = await githubPaginatedGet(
        `/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
        token,
        {},
        {
          returnAll: input.getManyReviewsReturnAll === true,
          limit: input.getManyReviewsLimit ?? 50,
        }
      )

      return {
        reviews: JSON.stringify(items),
        totalCount: String(totalCount),
      }
    }

    case 'update': {
      const prNumber = input.updateReviewPRNumber?.trim()
      if (!prNumber) {
        throw new BlockValidationError([
          { field: 'updateReviewPRNumber', message: 'Pull request number is required.' },
        ])
      }
      const reviewId = input.updateReviewId?.trim()
      if (!reviewId) {
        throw new BlockValidationError([
          { field: 'updateReviewId', message: 'Review ID is required.' },
        ])
      }
      const reviewBody = input.updateReviewBody?.trim()
      if (!reviewBody) {
        throw new BlockValidationError([
          { field: 'updateReviewBody', message: 'Review body is required.' },
        ])
      }

      const result = await githubApi(
        'PUT',
        `/repos/${owner}/${repo}/pulls/${prNumber}/reviews/${reviewId}`,
        token,
        { body: { body: reviewBody } }
      )

      return {
        reviewId: String(result.id),
        reviewState: result.state ?? '',
      }
    }

    default:
      throw new Error(`Unknown review operation: ${operation}`)
  }
}

import {
  ConflictError,
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  NotFoundError,
  RateLimitError,
  UpstreamServiceError,
} from '@auxx/sdk/server'
import { ERROR_MESSAGES } from './github-api'

export const GITHUB_GRAPHQL = 'https://api.github.com/graphql'

export interface GraphqlRateLimit {
  remaining: number
  resetAt: string
}

export interface GraphqlResult<T> {
  data: T
  rateLimit: GraphqlRateLimit | null
}

interface GraphqlError {
  message: string
  type?: string
  path?: (string | number)[]
}

/**
 * GitHub v4 GraphQL helper. New chat-tool server files default to this over
 * REST when the response shape benefits from a composite fetch (e.g. PR +
 * reviews + checks in one call). See plans/kopilot/apps/github-overhaul.md §7.
 *
 * Tools should select `rateLimit { remaining resetAt }` on every query; the
 * helper surfaces the field for streaming tools that want to adapt fan-out
 * cadence (see plan §8 Q3).
 */
export async function githubGraphql<T = unknown>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<GraphqlResult<T>> {
  let response: Response
  try {
    response = await fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ query, variables }),
    })
  } catch (err) {
    throw new UpstreamServiceError(err instanceof Error ? err.message : 'GitHub request failed')
  }

  if (!response.ok) {
    const errorMsg =
      ERROR_MESSAGES[response.status] ??
      `GitHub GraphQL error: ${response.status} ${response.statusText}`

    if (response.status === 401) throw new ConnectionExpiredError('organization')
    if (response.status === 403) throw new InsufficientPermissionsError('organization')
    if (response.status === 429) {
      const ra = Number(response.headers.get('Retry-After'))
      throw new RateLimitError(Number.isFinite(ra) ? ra : undefined)
    }
    if (response.status === 404) throw new NotFoundError(errorMsg)
    if (response.status === 409) throw new ConflictError(errorMsg)
    if (response.status >= 500) {
      throw new UpstreamServiceError(`GitHub error ${response.status}`, response.status)
    }
    if (response.status === 400 || response.status === 422) {
      throw new InvalidInputError(errorMsg)
    }
    throw new Error(errorMsg)
  }

  const body = (await response.json()) as {
    data?: T & { rateLimit?: GraphqlRateLimit }
    errors?: GraphqlError[]
  }

  if (body.errors && body.errors.length > 0) {
    const first = body.errors[0]
    const err = new Error(first?.message ?? 'GitHub GraphQL returned an error.') as Error & {
      code: string
    }
    err.code = 'GRAPHQL_ERROR'
    throw err
  }

  if (!body.data) {
    const err = new Error('GitHub GraphQL returned no data.') as Error & { code: string }
    err.code = 'GRAPHQL_ERROR'
    throw err
  }

  const rateLimit = (body.data as { rateLimit?: GraphqlRateLimit }).rateLimit ?? null
  return { data: body.data, rateLimit }
}

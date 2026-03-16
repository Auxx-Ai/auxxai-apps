import { ConnectionExpiredError } from '@auxx/sdk/server'

export const GITHUB_API = 'https://api.github.com'

export const ERROR_MESSAGES: Record<number, string> = {
  401: 'GitHub authentication failed. Please reconnect your account in Settings \u2192 Apps \u2192 GitHub.',
  403: 'Access denied. Your GitHub token may lack the required permissions, or you may have hit the rate limit.',
  404: 'The specified repository, issue, file, or resource was not found. Check that the owner and repository name are correct.',
  409: 'Conflict \u2014 the resource already exists or there is a merge conflict.',
  422: 'Validation failed. Please check your input values.',
}

export function throwConnectionNotFound(): never {
  const err = new Error(
    'GitHub account not connected. Please connect in Settings \u2192 Apps \u2192 GitHub.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

export async function githubApi(
  method: string,
  endpoint: string,
  token: string,
  options: { body?: Record<string, unknown>; qs?: Record<string, string> } = {}
): Promise<any> {
  const url = new URL(`${GITHUB_API}${endpoint}`)
  if (options.qs) {
    for (const [key, value] of Object.entries(options.qs)) {
      url.searchParams.set(key, value)
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const fetchOptions: RequestInit = { method, headers }
  if (options.body && method !== 'GET') {
    headers['Content-Type'] = 'application/json'
    fetchOptions.body = JSON.stringify(options.body)
  }

  const response = await fetch(url.toString(), fetchOptions)

  if (response.status === 204) return {}

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ConnectionExpiredError('organization')
    }

    const errorMsg =
      ERROR_MESSAGES[response.status] ??
      `GitHub API error: ${response.status} ${response.statusText}`
    throw new Error(errorMsg)
  }

  return response.json()
}

const MAX_PAGES = 50
const PAGE_SIZE = 100

export async function githubPaginatedGet<T = unknown>(
  endpoint: string,
  token: string,
  params: Record<string, string>,
  options: { returnAll: boolean; limit?: number }
): Promise<{ items: T[]; totalCount: number; truncated: boolean }> {
  const items: T[] = []
  let page = 1

  do {
    const qs = { ...params, per_page: String(PAGE_SIZE), page: String(page) }
    const response = await githubApi('GET', endpoint, token, { qs })
    items.push(...(Array.isArray(response) ? response : [response]))
    page++

    if (page > MAX_PAGES) break
    if (!options.returnAll && items.length >= (options.limit ?? 50)) break
    if ((Array.isArray(response) ? response : []).length < PAGE_SIZE) break
  } while (true)

  const truncated = items.length >= MAX_PAGES * PAGE_SIZE
  const limited = options.returnAll ? items : items.slice(0, options.limit ?? 50)
  return { items: limited, totalCount: limited.length, truncated }
}

export async function getFileSha(
  owner: string,
  repo: string,
  path: string,
  token: string,
  branch?: string
): Promise<string> {
  const params: Record<string, string> = {}
  if (branch) params.ref = branch
  const file = await githubApi(
    'GET',
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    token,
    {
      qs: params,
    }
  )
  return file.sha
}

// src/tools/internal/list-repos.tool.server.ts
//
// Lists the connected GitHub account's repositories via REST `GET /user/repos`
// (no search query needed). Backs the GitHub Issues connector's `repo` config
// picker — the platform calls this once through the connector's own connection
// and renders the returned `repos[].fullName` as a searchable dropdown (filtered
// client-side). Newest-updated first so the most relevant repos surface on top.

import { getGithubConnection } from '../shared/connection'

const GITHUB_API = 'https://api.github.com'
const PAGE_SIZE = 100

interface RawRepo {
  full_name: string
  name: string
  private: boolean
  description: string | null
  owner: { login: string } | null
}

interface RepoOption {
  fullName: string
  name: string
  owner: string | null
  private: boolean
  description: string | null
}

export default async function listGithubRepos(): Promise<{ repos: RepoOption[] }> {
  const { token } = getGithubConnection()

  const params = new URLSearchParams({
    per_page: String(PAGE_SIZE),
    sort: 'updated',
    affiliation: 'owner,collaborator,organization_member',
  })
  const res = await fetch(`${GITHUB_API}/user/repos?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'auxx-github-connector',
    },
  })
  if (!res.ok) {
    throw new Error(`github list repos: REST API responded ${res.status}`)
  }

  const repos = (await res.json()) as RawRepo[]
  return {
    repos: repos.map((r) => ({
      fullName: r.full_name,
      name: r.name,
      owner: r.owner?.login ?? null,
      private: r.private,
      description: r.description,
    })),
  }
}

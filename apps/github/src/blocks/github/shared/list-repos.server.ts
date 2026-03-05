// src/blocks/github/shared/list-repos.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { githubApi, throwConnectionNotFound } from './github-api'

export default async function listRepos(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const repos: { label: string; value: string }[] = []
  let page = 1

  do {
    const response = await githubApi('GET', '/user/repos', token, {
      qs: {
        per_page: '100',
        page: String(page),
        sort: 'updated',
        affiliation: 'owner,collaborator,organization_member',
      },
    })

    if (!Array.isArray(response) || response.length === 0) break

    for (const repo of response) {
      repos.push({
        label: repo.full_name,
        value: repo.full_name,
      })
    }

    if (response.length < 100) break
    page++
  } while (page <= 10)

  return repos.sort((a, b) => a.label.localeCompare(b.label))
}

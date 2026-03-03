import { getOrganizationConnection } from '@auxx/sdk/server'
import { githubApi, throwConnectionNotFound } from './github-api'

export default async function listBranches(
  owner: string,
  repo: string
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const branches: { label: string; value: string }[] = []
  let page = 1

  do {
    const response = await githubApi('GET', `/repos/${owner}/${repo}/branches`, token, {
      qs: { per_page: '100', page: String(page) },
    })

    if (!Array.isArray(response) || response.length === 0) break

    for (const branch of response) {
      branches.push({
        label: branch.name,
        value: branch.name,
      })
    }

    if (response.length < 100) break
    page++
  } while (page <= 5)

  return branches.sort((a, b) => a.label.localeCompare(b.label))
}

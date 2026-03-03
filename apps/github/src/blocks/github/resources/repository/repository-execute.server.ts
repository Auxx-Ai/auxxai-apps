import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { githubApi, githubPaginatedGet, throwConnectionNotFound } from '../../shared/github-api'

export async function executeRepository(
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
    case 'get': {
      const result = await githubApi('GET', `/repos/${owner}/${repo}`, token)

      return {
        repoName: result.name ?? '',
        repoFullName: result.full_name ?? '',
        repoDescription: result.description ?? '',
        repoUrl: result.html_url ?? '',
        repoDefaultBranch: result.default_branch ?? '',
        repoPrivate: String(result.private ?? false),
        repoStars: String(result.stargazers_count ?? 0),
        repoForks: String(result.forks_count ?? 0),
        repoOpenIssues: String(result.open_issues_count ?? 0),
      }
    }

    case 'getIssues': {
      const params: Record<string, string> = {
        state: input.getIssuesState ?? 'open',
        sort: input.getIssuesSort ?? 'created',
        direction: input.getIssuesDirection ?? 'desc',
      }
      if (input.getIssuesLabels?.trim()) params.labels = input.getIssuesLabels.trim()
      if (input.getIssuesAssignee?.trim()) params.assignee = input.getIssuesAssignee.trim()
      if (input.getIssuesSince?.trim()) params.since = input.getIssuesSince.trim()

      const { items, totalCount, truncated } = await githubPaginatedGet(
        `/repos/${owner}/${repo}/issues`,
        token,
        params,
        {
          returnAll: input.getIssuesReturnAll === true,
          limit: input.getIssuesLimit ?? 50,
        }
      )

      return {
        issues: JSON.stringify(items),
        totalCount: String(totalCount),
        truncated: String(truncated),
      }
    }

    case 'getPullRequests': {
      const params: Record<string, string> = {
        state: input.getPRsState ?? 'open',
        sort: input.getPRsSort ?? 'created',
        direction: input.getPRsDirection ?? 'desc',
      }

      const { items, totalCount, truncated } = await githubPaginatedGet(
        `/repos/${owner}/${repo}/pulls`,
        token,
        params,
        {
          returnAll: input.getPRsReturnAll === true,
          limit: input.getPRsLimit ?? 50,
        }
      )

      return {
        pullRequests: JSON.stringify(items),
        totalCount: String(totalCount),
        truncated: String(truncated),
      }
    }

    default:
      throw new Error(`Unknown repository operation: ${operation}`)
  }
}

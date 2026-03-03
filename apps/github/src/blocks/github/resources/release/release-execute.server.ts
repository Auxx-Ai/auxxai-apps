import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { githubApi, githubPaginatedGet, throwConnectionNotFound } from '../../shared/github-api'

export async function executeRelease(
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
      const tagName = input.createReleaseTag?.trim()
      if (!tagName) {
        throw new BlockValidationError([
          { field: 'createReleaseTag', message: 'Tag name is required.' },
        ])
      }

      const body: Record<string, unknown> = { tag_name: tagName }
      if (input.createReleaseName?.trim()) body.name = input.createReleaseName.trim()
      if (input.createReleaseBody) body.body = input.createReleaseBody
      if (input.createReleaseDraft === true) body.draft = true
      if (input.createReleasePrerelease === true) body.prerelease = true
      if (input.createReleaseTarget?.trim())
        body.target_commitish = input.createReleaseTarget.trim()

      const result = await githubApi('POST', `/repos/${owner}/${repo}/releases`, token, { body })

      return {
        releaseId: String(result.id),
        releaseTag: result.tag_name ?? '',
        releaseUrl: result.url ?? '',
        releaseHtmlUrl: result.html_url ?? '',
      }
    }

    case 'delete': {
      const releaseId = input.deleteReleaseId?.trim()
      if (!releaseId) {
        throw new BlockValidationError([
          { field: 'deleteReleaseId', message: 'Release ID is required.' },
        ])
      }

      await githubApi('DELETE', `/repos/${owner}/${repo}/releases/${releaseId}`, token)

      return { deleted: 'true' }
    }

    case 'get': {
      const releaseId = input.getReleaseId?.trim()
      if (!releaseId) {
        throw new BlockValidationError([
          { field: 'getReleaseId', message: 'Release ID is required.' },
        ])
      }

      const result = await githubApi('GET', `/repos/${owner}/${repo}/releases/${releaseId}`, token)

      return {
        releaseId: String(result.id),
        releaseTag: result.tag_name ?? '',
        releaseName: result.name ?? '',
        releaseBody: result.body ?? '',
        releaseUrl: result.url ?? '',
        releaseHtmlUrl: result.html_url ?? '',
        releaseDraft: String(result.draft ?? false),
        releasePrerelease: String(result.prerelease ?? false),
        releaseCreatedAt: result.created_at ?? '',
      }
    }

    case 'getMany': {
      const { items, totalCount, truncated } = await githubPaginatedGet(
        `/repos/${owner}/${repo}/releases`,
        token,
        {},
        {
          returnAll: input.getManyReleasesReturnAll === true,
          limit: input.getManyReleasesLimit ?? 50,
        }
      )

      return {
        releases: JSON.stringify(items),
        totalCount: String(totalCount),
        truncated: String(truncated),
      }
    }

    case 'update': {
      const releaseId = input.updateReleaseId?.trim()
      if (!releaseId) {
        throw new BlockValidationError([
          { field: 'updateReleaseId', message: 'Release ID is required.' },
        ])
      }

      const body: Record<string, unknown> = {}
      if (input.updateReleaseTag?.trim()) body.tag_name = input.updateReleaseTag.trim()
      if (input.updateReleaseName?.trim()) body.name = input.updateReleaseName.trim()
      if (input.updateReleaseBody) body.body = input.updateReleaseBody
      if (input.updateReleaseDraft !== undefined) body.draft = input.updateReleaseDraft === true
      if (input.updateReleasePrerelease !== undefined)
        body.prerelease = input.updateReleasePrerelease === true
      if (input.updateReleaseTarget?.trim())
        body.target_commitish = input.updateReleaseTarget.trim()

      const result = await githubApi(
        'PATCH',
        `/repos/${owner}/${repo}/releases/${releaseId}`,
        token,
        { body }
      )

      return {
        releaseId: String(result.id),
        releaseTag: result.tag_name ?? '',
        releaseUrl: result.html_url ?? '',
      }
    }

    default:
      throw new Error(`Unknown release operation: ${operation}`)
  }
}

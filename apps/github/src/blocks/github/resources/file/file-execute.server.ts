import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { githubApi, getFileSha, throwConnectionNotFound } from '../../shared/github-api'
import { resolveOwnerRepo } from '../../shared/github-helpers'

export async function executeFile(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const { owner, repo } = resolveOwnerRepo(input)

  switch (operation) {
    case 'create': {
      const path = input.createFilePath?.trim()
      if (!path) {
        throw new BlockValidationError([
          { field: 'createFilePath', message: 'File path is required.' },
        ])
      }
      const content = input.createFileContent
      if (!content) {
        throw new BlockValidationError([
          { field: 'createFileContent', message: 'File content is required.' },
        ])
      }
      const message = input.createFileCommitMessage?.trim()
      if (!message) {
        throw new BlockValidationError([
          { field: 'createFileCommitMessage', message: 'Commit message is required.' },
        ])
      }

      const body: Record<string, unknown> = {
        message,
        content: btoa(unescape(encodeURIComponent(content))),
      }
      if (input.createFileBranch?.trim()) body.branch = input.createFileBranch.trim()

      const result = await githubApi(
        'PUT',
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
        token,
        { body }
      )

      return {
        filePath: result.content?.path ?? path,
        fileSha: result.content?.sha ?? '',
        commitSha: result.commit?.sha ?? '',
        commitUrl: result.commit?.html_url ?? '',
      }
    }

    case 'delete': {
      const path = input.deleteFilePath?.trim()
      if (!path) {
        throw new BlockValidationError([
          { field: 'deleteFilePath', message: 'File path is required.' },
        ])
      }
      const message = input.deleteFileCommitMessage?.trim()
      if (!message) {
        throw new BlockValidationError([
          { field: 'deleteFileCommitMessage', message: 'Commit message is required.' },
        ])
      }

      const branch = input.deleteFileBranch?.trim() || undefined
      const sha = await getFileSha(owner, repo, path, token, branch)

      const body: Record<string, unknown> = { message, sha }
      if (branch) body.branch = branch

      const result = await githubApi(
        'DELETE',
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
        token,
        { body }
      )

      return {
        commitSha: result.commit?.sha ?? '',
        commitUrl: result.commit?.html_url ?? '',
      }
    }

    case 'edit': {
      const path = input.editFilePath?.trim()
      if (!path) {
        throw new BlockValidationError([
          { field: 'editFilePath', message: 'File path is required.' },
        ])
      }
      const content = input.editFileContent
      if (!content) {
        throw new BlockValidationError([
          { field: 'editFileContent', message: 'File content is required.' },
        ])
      }
      const message = input.editFileCommitMessage?.trim()
      if (!message) {
        throw new BlockValidationError([
          { field: 'editFileCommitMessage', message: 'Commit message is required.' },
        ])
      }

      const branch = input.editFileBranch?.trim() || undefined
      const sha = await getFileSha(owner, repo, path, token, branch)

      const body: Record<string, unknown> = {
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        sha,
      }
      if (branch) body.branch = branch

      const result = await githubApi(
        'PUT',
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
        token,
        { body }
      )

      return {
        filePath: result.content?.path ?? path,
        fileSha: result.content?.sha ?? '',
        commitSha: result.commit?.sha ?? '',
        commitUrl: result.commit?.html_url ?? '',
      }
    }

    case 'get': {
      const path = input.getFilePath?.trim()
      if (!path) {
        throw new BlockValidationError([
          { field: 'getFilePath', message: 'File path is required.' },
        ])
      }

      const qs: Record<string, string> = {}
      if (input.getFileBranch?.trim()) qs.ref = input.getFileBranch.trim()

      const result = await githubApi(
        'GET',
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
        token,
        { qs }
      )

      let fileContent = ''
      if (result.content) {
        fileContent = decodeURIComponent(escape(atob(result.content.replace(/\n/g, ''))))
      } else if (result.download_url) {
        const response = await fetch(result.download_url)
        fileContent = await response.text()
      }

      return {
        fileName: result.name ?? '',
        filePath: result.path ?? path,
        fileContent,
        fileSha: result.sha ?? '',
        fileSize: String(result.size ?? 0),
      }
    }

    case 'list': {
      const path = input.listFilePath?.trim() || ''

      const qs: Record<string, string> = {}
      if (input.listFileBranch?.trim()) qs.ref = input.listFileBranch.trim()

      const endpoint = path
        ? `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`
        : `/repos/${owner}/${repo}/contents/`

      const result = await githubApi('GET', endpoint, token, { qs })
      const items = Array.isArray(result) ? result : [result]

      const files = items.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        sha: item.sha,
      }))

      return {
        files: files,
        totalCount: String(files.length),
      }
    }

    default:
      throw new Error(`Unknown file operation: ${operation}`)
  }
}

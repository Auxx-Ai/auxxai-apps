import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { githubApi, throwConnectionNotFound } from '../../shared/github-api'

function parseCommaSeparated(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function executeIssue(
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
      const title = input.createIssueTitle?.trim()
      if (!title) {
        throw new BlockValidationError([
          { field: 'createIssueTitle', message: 'Issue title is required.' },
        ])
      }

      const body: Record<string, unknown> = { title }
      if (input.createIssueBody) body.body = input.createIssueBody
      const labels = parseCommaSeparated(input.createIssueLabels)
      if (labels.length) body.labels = labels
      const assignees = parseCommaSeparated(input.createIssueAssignees)
      if (assignees.length) body.assignees = assignees

      const result = await githubApi('POST', `/repos/${owner}/${repo}/issues`, token, { body })

      return {
        issueNumber: String(result.number),
        issueUrl: result.html_url ?? '',
        issueId: String(result.id),
        issueState: result.state ?? '',
      }
    }

    case 'createComment': {
      const issueNumber = input.commentIssueNumber?.trim()
      if (!issueNumber) {
        throw new BlockValidationError([
          { field: 'commentIssueNumber', message: 'Issue number is required.' },
        ])
      }
      const commentBody = input.commentBody?.trim()
      if (!commentBody) {
        throw new BlockValidationError([
          { field: 'commentBody', message: 'Comment body is required.' },
        ])
      }

      const result = await githubApi(
        'POST',
        `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
        token,
        { body: { body: commentBody } }
      )

      return {
        commentId: String(result.id),
        commentUrl: result.html_url ?? '',
      }
    }

    case 'edit': {
      const issueNumber = input.editIssueNumber?.trim()
      if (!issueNumber) {
        throw new BlockValidationError([
          { field: 'editIssueNumber', message: 'Issue number is required.' },
        ])
      }

      const body: Record<string, unknown> = {}
      if (input.editIssueTitle?.trim()) body.title = input.editIssueTitle.trim()
      if (input.editIssueBody) body.body = input.editIssueBody
      if (input.editIssueState) body.state = input.editIssueState
      if (input.editIssueStateReason) body.state_reason = input.editIssueStateReason
      const labels = parseCommaSeparated(input.editIssueLabels)
      if (labels.length) body.labels = labels
      const assignees = parseCommaSeparated(input.editIssueAssignees)
      if (assignees.length) body.assignees = assignees

      const result = await githubApi(
        'PATCH',
        `/repos/${owner}/${repo}/issues/${issueNumber}`,
        token,
        { body }
      )

      return {
        issueNumber: String(result.number),
        issueUrl: result.html_url ?? '',
        issueState: result.state ?? '',
      }
    }

    case 'get': {
      const issueNumber = input.getIssueNumber?.trim()
      if (!issueNumber) {
        throw new BlockValidationError([
          { field: 'getIssueNumber', message: 'Issue number is required.' },
        ])
      }

      const result = await githubApi('GET', `/repos/${owner}/${repo}/issues/${issueNumber}`, token)

      return {
        issueNumber: String(result.number),
        issueTitle: result.title ?? '',
        issueBody: result.body ?? '',
        issueState: result.state ?? '',
        issueUrl: result.html_url ?? '',
        issueLabels: JSON.stringify((result.labels ?? []).map((l: any) => l.name ?? l)),
        issueAssignees: JSON.stringify((result.assignees ?? []).map((a: any) => a.login)),
        issueCreatedAt: result.created_at ?? '',
        issueUpdatedAt: result.updated_at ?? '',
      }
    }

    case 'lock': {
      const issueNumber = input.lockIssueNumber?.trim()
      if (!issueNumber) {
        throw new BlockValidationError([
          { field: 'lockIssueNumber', message: 'Issue number is required.' },
        ])
      }

      const body: Record<string, unknown> = {}
      if (input.lockReason) body.lock_reason = input.lockReason

      await githubApi('PUT', `/repos/${owner}/${repo}/issues/${issueNumber}/lock`, token, { body })

      return { locked: 'true' }
    }

    default:
      throw new Error(`Unknown issue operation: ${operation}`)
  }
}

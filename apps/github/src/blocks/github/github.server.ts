import { VALID_OPERATIONS } from './resources/constants'
import { executeIssue } from './resources/issue/issue-execute.server'
import { executeFile } from './resources/file/file-execute.server'
import { executeRepository } from './resources/repository/repository-execute.server'
import { executeRelease } from './resources/release/release-execute.server'
import { executeReview } from './resources/review/review-execute.server'

export default async function githubExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'issue':
      return executeIssue(operation, input)
    case 'file':
      return executeFile(operation, input)
    case 'repository':
      return executeRepository(operation, input)
    case 'release':
      return executeRelease(operation, input)
    case 'review':
      return executeReview(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}

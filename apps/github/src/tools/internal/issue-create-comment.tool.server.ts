// src/tools/internal/issue-create-comment.tool.server.ts

import { executeIssue } from '../../blocks/github/resources/issue/issue-execute.server'

export default async function issueCreateComment(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeIssue('createComment', input as Record<string, any>)
}

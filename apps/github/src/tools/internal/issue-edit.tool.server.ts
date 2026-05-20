// src/tools/internal/issue-edit.tool.server.ts

import { executeIssue } from '../../blocks/github/resources/issue/issue-execute.server'

export default async function issueEdit(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeIssue('edit', input as Record<string, any>)
}

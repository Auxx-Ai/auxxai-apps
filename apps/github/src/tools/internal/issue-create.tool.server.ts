// src/tools/internal/issue-create.tool.server.ts

import { executeIssue } from '../../blocks/github/resources/issue/issue-execute.server'

export default async function issueCreate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeIssue('create', input as Record<string, any>)
}

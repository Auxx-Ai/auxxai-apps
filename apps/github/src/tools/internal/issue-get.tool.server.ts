// src/tools/internal/issue-get.tool.server.ts

import { executeIssue } from '../../blocks/github/resources/issue/issue-execute.server'

export default async function issueGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeIssue('get', input as Record<string, any>)
}

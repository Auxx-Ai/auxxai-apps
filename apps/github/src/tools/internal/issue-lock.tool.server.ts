// src/tools/internal/issue-lock.tool.server.ts

import { executeIssue } from '../../blocks/github/resources/issue/issue-execute.server'

export default async function issueLock(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeIssue('lock', input as Record<string, any>)
}

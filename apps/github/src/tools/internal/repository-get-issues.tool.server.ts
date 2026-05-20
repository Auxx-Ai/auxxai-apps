// src/tools/internal/repository-get-issues.tool.server.ts

import { executeRepository } from '../../blocks/github/resources/repository/repository-execute.server'

export default async function repositoryGetIssues(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeRepository('getIssues', input as Record<string, any>)
}

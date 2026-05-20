// src/tools/internal/repository-get-pull-requests.tool.server.ts

import { executeRepository } from '../../blocks/github/resources/repository/repository-execute.server'

export default async function repositoryGetPullRequests(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeRepository('getPullRequests', input as Record<string, any>)
}

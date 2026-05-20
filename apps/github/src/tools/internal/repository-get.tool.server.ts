// src/tools/internal/repository-get.tool.server.ts

import { executeRepository } from '../../blocks/github/resources/repository/repository-execute.server'

export default async function repositoryGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeRepository('get', input as Record<string, any>)
}

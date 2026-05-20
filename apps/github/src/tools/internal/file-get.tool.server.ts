// src/tools/internal/file-get.tool.server.ts

import { executeFile } from '../../blocks/github/resources/file/file-execute.server'

export default async function fileGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeFile('get', input as Record<string, any>)
}

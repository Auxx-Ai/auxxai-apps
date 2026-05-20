// src/tools/internal/file-list.tool.server.ts

import { executeFile } from '../../blocks/github/resources/file/file-execute.server'

export default async function fileList(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeFile('list', input as Record<string, any>)
}

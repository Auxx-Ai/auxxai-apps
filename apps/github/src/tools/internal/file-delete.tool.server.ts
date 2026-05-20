// src/tools/internal/file-delete.tool.server.ts

import { executeFile } from '../../blocks/github/resources/file/file-execute.server'

export default async function fileDelete(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeFile('delete', input as Record<string, any>)
}

// src/tools/internal/file-edit.tool.server.ts

import { executeFile } from '../../blocks/github/resources/file/file-execute.server'

export default async function fileEdit(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeFile('edit', input as Record<string, any>)
}

// src/tools/internal/file-create.tool.server.ts

import { executeFile } from '../../blocks/github/resources/file/file-execute.server'

export default async function fileCreate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeFile('create', input as Record<string, any>)
}

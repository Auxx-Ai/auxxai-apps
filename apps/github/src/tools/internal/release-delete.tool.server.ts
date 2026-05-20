// src/tools/internal/release-delete.tool.server.ts

import { executeRelease } from '../../blocks/github/resources/release/release-execute.server'

export default async function releaseDelete(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeRelease('delete', input as Record<string, any>)
}

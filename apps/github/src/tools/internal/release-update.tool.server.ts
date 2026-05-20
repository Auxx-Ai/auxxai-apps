// src/tools/internal/release-update.tool.server.ts

import { executeRelease } from '../../blocks/github/resources/release/release-execute.server'

export default async function releaseUpdate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeRelease('update', input as Record<string, any>)
}

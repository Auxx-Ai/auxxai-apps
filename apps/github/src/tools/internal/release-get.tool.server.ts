// src/tools/internal/release-get.tool.server.ts

import { executeRelease } from '../../blocks/github/resources/release/release-execute.server'

export default async function releaseGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeRelease('get', input as Record<string, any>)
}

// src/tools/internal/release-get-many.tool.server.ts

import { executeRelease } from '../../blocks/github/resources/release/release-execute.server'

export default async function releaseGetMany(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeRelease('getMany', input as Record<string, any>)
}

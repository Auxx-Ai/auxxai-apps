// src/tools/internal/release-create.tool.server.ts

import { executeRelease } from '../../blocks/github/resources/release/release-execute.server'

export default async function releaseCreate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeRelease('create', input as Record<string, any>)
}

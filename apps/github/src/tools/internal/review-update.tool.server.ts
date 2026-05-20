// src/tools/internal/review-update.tool.server.ts

import { executeReview } from '../../blocks/github/resources/review/review-execute.server'

export default async function reviewUpdate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeReview('update', input as Record<string, any>)
}

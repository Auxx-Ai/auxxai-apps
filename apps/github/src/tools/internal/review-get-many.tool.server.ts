// src/tools/internal/review-get-many.tool.server.ts

import { executeReview } from '../../blocks/github/resources/review/review-execute.server'

export default async function reviewGetMany(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeReview('getMany', input as Record<string, any>)
}

// src/tools/internal/review-get.tool.server.ts

import { executeReview } from '../../blocks/github/resources/review/review-execute.server'

export default async function reviewGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeReview('get', input as Record<string, any>)
}

// src/tools/internal/review-create.tool.server.ts

import { executeReview } from '../../blocks/github/resources/review/review-execute.server'

export default async function reviewCreate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeReview('create', input as Record<string, any>)
}

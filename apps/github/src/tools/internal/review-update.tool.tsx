// src/tools/internal/review-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import reviewUpdateExecute from './review-update.tool.server'

export const githubReviewUpdateTool = defineTool({
  id: 'github_review_update',
  name: 'GitHub: update review (block)',
  description: 'Internal — backs the GitHub workflow block (review.update).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: reviewUpdateExecute,
})

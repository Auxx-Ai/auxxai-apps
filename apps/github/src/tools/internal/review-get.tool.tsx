// src/tools/internal/review-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import reviewGetExecute from './review-get.tool.server'

export const githubReviewGetTool = defineTool({
  id: 'github_review_get',
  name: 'GitHub: get review (block)',
  description: 'Internal — backs the GitHub workflow block (review.get).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: reviewGetExecute,
})

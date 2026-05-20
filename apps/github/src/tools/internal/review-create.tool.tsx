// src/tools/internal/review-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import reviewCreateExecute from './review-create.tool.server'

export const githubReviewCreateTool = defineTool({
  id: 'github_review_create',
  name: 'GitHub: create review (block)',
  description: 'Internal — backs the GitHub workflow block (review.create).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: reviewCreateExecute,
})

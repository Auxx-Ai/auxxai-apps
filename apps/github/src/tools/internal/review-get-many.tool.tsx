// src/tools/internal/review-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import reviewGetManyExecute from './review-get-many.tool.server'

export const githubReviewGetManyTool = defineTool({
  id: 'github_review_get_many',
  name: 'GitHub: list reviews (block)',
  description: 'Internal — backs the GitHub workflow block (review.getMany).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: reviewGetManyExecute,
})

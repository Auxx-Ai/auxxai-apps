// src/tools/review-github-pull-request.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import reviewGithubPullRequestExecute from './review-github-pull-request.tool.server'

export const reviewGithubPullRequestTool = defineTool({
  id: 'review_github_pull_request',
  name: 'Review GitHub pull request',
  description:
    'Submit a pull request review with APPROVE or COMMENT (non-blocking). REQUEST_CHANGES is intentionally not exposed — it blocks merge and lives in a future write-toolset split.',
  icon: githubIcon,
  inputs: z
    .object({
      owner: z.string(),
      repo: z.string(),
      prNumber: z.number().int(),
      event: z
        .enum(['APPROVE', 'COMMENT'])
        .describe('APPROVE or COMMENT. REQUEST_CHANGES is intentionally not available in v1.'),
      body: z
        .string()
        .optional()
        .describe('Review body (Markdown). Required when event=COMMENT, optional for APPROVE.'),
    })
    .refine((v) => v.event !== 'COMMENT' || (v.body ?? '').trim().length > 0, {
      message: 'event=COMMENT requires a non-empty body.',
    }),
  outputs: z.object({
    reviewId: z.string(),
    state: z.enum(['APPROVED', 'COMMENTED']),
    submittedAt: z.string(),
    url: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: reviewGithubPullRequestExecute,
})

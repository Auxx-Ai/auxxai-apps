// src/tools/find-github-pull-request.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import findGithubPullRequestExecute from './find-github-pull-request.tool.server'

export const findGithubPullRequestTool = defineTool({
  id: 'find_github_pull_request',
  name: 'Find GitHub pull request',
  description:
    'Look up a GitHub pull request by number or free-text title query. Returns PR metadata only; call get_github_pull_request for body, reviews, and check status.',
  icon: githubIcon,
  inputs: z
    .object({
      owner: z.string(),
      repo: z.string(),
      prNumber: z.number().int().optional(),
      titleQuery: z.string().optional(),
    })
    .refine((v) => (v.prNumber != null ? 1 : 0) + (v.titleQuery ? 1 : 0) === 1, {
      message: 'Provide exactly one of prNumber or titleQuery.',
    }),
  outputs: z.object({
    found: z.boolean(),
    pullRequest: z
      .object({
        prNumber: z.number().int(),
        title: z.string(),
        state: z.enum(['open', 'closed', 'merged']),
        isDraft: z.boolean(),
        author: z.string().nullable(),
        headRef: z.string().describe('Source branch.'),
        baseRef: z.string().describe('Target branch.'),
        url: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
      .nullable(),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: findGithubPullRequestExecute,
})

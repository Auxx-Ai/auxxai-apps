// src/tools/search-github-pull-requests.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import searchGithubPullRequestsExecute from './search-github-pull-requests.tool.server'

export const searchGithubPullRequestsTool = defineTool({
  id: 'search_github_pull_requests',
  name: 'Search GitHub pull requests',
  description:
    'Search GitHub pull requests by repo, state, author, assignee, review-requested, reviewed-by, base branch, or free-text. Cross-repo allowed when owner+repo are both omitted.',
  icon: githubIcon,
  inputs: z.object({
    owner: z.string().optional(),
    repo: z.string().optional(),
    q: z.string().optional().describe('Free-text against title and body.'),
    state: z.enum(['open', 'closed', 'merged', 'all']).optional().describe('Default open.'),
    author: z.string().optional(),
    assignee: z.string().optional(),
    reviewRequested: z
      .string()
      .optional()
      .describe('Restrict to PRs where this login has a pending review request.'),
    reviewedBy: z.string().optional().describe('Restrict to PRs already reviewed by this login.'),
    baseRef: z.string().optional().describe('Filter by base branch (e.g. main, dev).'),
    since: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional().describe('Default 25.'),
  }),
  outputs: z.object({
    pullRequests: z.array(
      z.object({
        repoFullName: z.string(),
        prNumber: z.number().int(),
        title: z.string(),
        state: z.enum(['open', 'closed', 'merged']),
        isDraft: z.boolean(),
        author: z.string().nullable(),
        headRef: z.string(),
        baseRef: z.string(),
        url: z.string(),
        updatedAt: z.string(),
        labels: z.array(z.string()),
        requestedReviewers: z.array(z.string()),
      })
    ),
    truncated: z.boolean(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchGithubPullRequestsExecute,
})

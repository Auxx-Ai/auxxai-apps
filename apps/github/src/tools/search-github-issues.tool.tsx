// src/tools/search-github-issues.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import searchGithubIssuesExecute from './search-github-issues.tool.server'

export const searchGithubIssuesTool = defineTool({
  id: 'search_github_issues',
  name: 'Search GitHub issues',
  description:
    'Search GitHub issues by repo, state, labels, assignee, author, or free-text. Cross-repo search is allowed when owner+repo are both omitted (use sparingly — wider scope = noisier results).',
  icon: githubIcon,
  inputs: z.object({
    owner: z
      .string()
      .optional()
      .describe(
        'Restrict to owner. Omit + repo to search across all accessible repos (e.g. for org-wide queries).'
      ),
    repo: z.string().optional(),
    q: z.string().optional().describe('Free-text query across title and body.'),
    state: z.enum(['open', 'closed', 'all']).optional().describe('Default open.'),
    labels: z.array(z.string()).optional().describe('Labels that ALL must match (AND).'),
    assignee: z
      .string()
      .optional()
      .describe('GitHub login. Use `none` for unassigned, `*` for any.'),
    author: z.string().optional(),
    since: z.string().optional().describe('ISO 8601 lower bound on updatedAt.'),
    limit: z.number().int().min(1).max(50).optional().describe('Default 25.'),
  }),
  outputs: z.object({
    issues: z.array(
      z.object({
        repoFullName: z.string(),
        issueNumber: z.number().int(),
        title: z.string(),
        state: z.enum(['open', 'closed']),
        author: z.string().nullable(),
        url: z.string(),
        updatedAt: z.string(),
        labels: z.array(z.string()),
        assignees: z.array(z.string()),
        commentsCount: z.number().int(),
      })
    ),
    truncated: z.boolean(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchGithubIssuesExecute,
})

// src/tools/get-github-issue.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import getGithubIssueExecute from './get-github-issue.tool.server'

export const getGithubIssueTool = defineTool({
  id: 'get_github_issue',
  name: 'Get GitHub issue',
  description:
    'Fetch a GitHub issue in full — body, labels, assignees, recent comments. Use this when the user wants to read or discuss the contents of a specific issue.',
  icon: githubIcon,
  inputs: z.object({
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.number().int(),
    includeComments: z
      .boolean()
      .optional()
      .describe('Default true. Set false to skip comment fetch when only metadata is needed.'),
    commentsLimit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe('Default 25. Most recent first.'),
  }),
  outputs: z.object({
    issueNumber: z.number().int(),
    title: z.string(),
    body: z.string().nullable().describe('Markdown body. Null for empty issues.'),
    state: z.enum(['open', 'closed']),
    stateReason: z.enum(['completed', 'not_planned', 'reopened']).nullable(),
    author: z.string().nullable(),
    url: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    closedAt: z.string().nullable(),
    labels: z.array(z.string()),
    assignees: z.array(z.string()),
    commentsCount: z.number().int(),
    comments: z
      .array(
        z.object({
          commentId: z.string(),
          author: z.string().nullable(),
          body: z.string(),
          createdAt: z.string(),
          url: z.string(),
        })
      )
      .describe('Most-recent-first. Truncated to `commentsLimit`.'),
    commentsTruncated: z.boolean(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: getGithubIssueExecute,
  agent: { toolsetSlug: 'github.issues' },
})

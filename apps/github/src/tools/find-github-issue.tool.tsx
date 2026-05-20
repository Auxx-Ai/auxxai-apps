// src/tools/find-github-issue.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import findGithubIssueExecute from './find-github-issue.tool.server'

export const findGithubIssueTool = defineTool({
  id: 'find_github_issue',
  name: 'Find GitHub issue',
  description:
    'Look up a GitHub issue by number or free-text title query. Returns issue metadata only; call get_github_issue for full body + comments.',
  icon: githubIcon,
  inputs: z
    .object({
      owner: z.string(),
      repo: z.string(),
      issueNumber: z
        .number()
        .int()
        .optional()
        .describe('GitHub issue number (the `#123` form). Provide number OR titleQuery, not both.'),
      titleQuery: z
        .string()
        .optional()
        .describe('Free-text against the issue title. Provide number OR titleQuery.'),
    })
    .refine((v) => (v.issueNumber != null ? 1 : 0) + (v.titleQuery ? 1 : 0) === 1, {
      message: 'Provide exactly one of issueNumber or titleQuery.',
    }),
  outputs: z.object({
    found: z.boolean(),
    issue: z
      .object({
        issueNumber: z.number().int(),
        title: z.string(),
        state: z.enum(['open', 'closed']),
        author: z.string().nullable().describe('GitHub login of the author, null for ghost user.'),
        url: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
        commentsCount: z.number().int(),
        labels: z.array(z.string()),
        assignees: z.array(z.string()).describe('GitHub logins of assignees.'),
      })
      .nullable(),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: findGithubIssueExecute,
  agent: { toolsetSlug: 'github.issues' },
})

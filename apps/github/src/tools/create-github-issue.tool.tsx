// src/tools/create-github-issue.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import createGithubIssueExecute from './create-github-issue.tool.server'

export const createGithubIssueTool = defineTool({
  id: 'create_github_issue',
  name: 'Create GitHub issue',
  description:
    'Open a new GitHub issue in a repository. Returns the new issue number and URL. The connected account must have write access to the repo.',
  icon: githubIcon,
  inputs: z.object({
    owner: z.string(),
    repo: z.string(),
    title: z.string().describe('Issue title.'),
    body: z.string().optional().describe('Markdown body.'),
    labels: z
      .array(z.string())
      .optional()
      .describe('Label names to apply on creation. Must already exist on the repo.'),
    assignees: z
      .array(z.string())
      .optional()
      .describe('GitHub logins to assign. Must have repo access.'),
  }),
  outputs: z.object({
    issueNumber: z.number().int(),
    url: z.string(),
    state: z.literal('open'),
    createdAt: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: createGithubIssueExecute,
  agent: { toolsetSlug: 'github.issues' },
})

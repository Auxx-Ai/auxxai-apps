// src/tools/comment-on-github-issue.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import commentOnGithubIssueExecute from './comment-on-github-issue.tool.server'

export const commentOnGithubIssueTool = defineTool({
  id: 'comment_on_github_issue',
  name: 'Comment on GitHub issue',
  description:
    'Post a Markdown comment on an existing GitHub issue. Use comment_on_github_pull_request for PRs.',
  icon: githubIcon,
  inputs: z.object({
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.number().int(),
    body: z.string().describe('Markdown comment body.'),
  }),
  outputs: z.object({
    commentId: z.string(),
    url: z.string(),
    createdAt: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: commentOnGithubIssueExecute,
  agent: { toolsetSlug: 'github.issues' },
})

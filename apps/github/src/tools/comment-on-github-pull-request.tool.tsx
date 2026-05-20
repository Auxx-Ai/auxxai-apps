// src/tools/comment-on-github-pull-request.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import commentOnGithubPullRequestExecute from './comment-on-github-pull-request.tool.server'

export const commentOnGithubPullRequestTool = defineTool({
  id: 'comment_on_github_pull_request',
  name: 'Comment on GitHub pull request',
  description:
    'Post a Markdown comment on the PR conversation thread. Use review_github_pull_request for APPROVE/COMMENT reviews, or comment_on_github_issue for issues.',
  icon: githubIcon,
  inputs: z.object({
    owner: z.string(),
    repo: z.string(),
    prNumber: z.number().int(),
    body: z
      .string()
      .describe(
        'Markdown comment body. Posts as a PR conversation comment, not a code-review comment on a specific line.'
      ),
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
  execute: commentOnGithubPullRequestExecute,
  agent: { toolsetSlug: 'github.pulls' },
})

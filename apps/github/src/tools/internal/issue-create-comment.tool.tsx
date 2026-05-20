// src/tools/internal/issue-create-comment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import issueCreateCommentExecute from './issue-create-comment.tool.server'

export const githubIssueCreateCommentTool = defineTool({
  id: 'github_issue_create_comment',
  name: 'GitHub: comment on issue (block)',
  description: 'Internal — backs the GitHub workflow block (issue.createComment).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: issueCreateCommentExecute,
})

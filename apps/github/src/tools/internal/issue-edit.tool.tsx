// src/tools/internal/issue-edit.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import issueEditExecute from './issue-edit.tool.server'

export const githubIssueEditTool = defineTool({
  id: 'github_issue_edit',
  name: 'GitHub: edit issue (block)',
  description: 'Internal — backs the GitHub workflow block (issue.edit).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: issueEditExecute,
})

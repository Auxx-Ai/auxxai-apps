// src/tools/internal/issue-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import issueCreateExecute from './issue-create.tool.server'

export const githubIssueCreateTool = defineTool({
  id: 'github_issue_create',
  name: 'GitHub: create issue (block)',
  description: 'Internal — backs the GitHub workflow block (issue.create).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: issueCreateExecute,
})

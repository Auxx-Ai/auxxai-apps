// src/tools/internal/issue-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import issueGetExecute from './issue-get.tool.server'

export const githubIssueGetTool = defineTool({
  id: 'github_issue_get',
  name: 'GitHub: get issue (block)',
  description: 'Internal — backs the GitHub workflow block (issue.get).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: issueGetExecute,
})

// src/tools/internal/issue-lock.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import issueLockExecute from './issue-lock.tool.server'

export const githubIssueLockTool = defineTool({
  id: 'github_issue_lock',
  name: 'GitHub: lock issue (block)',
  description: 'Internal — backs the GitHub workflow block (issue.lock).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: issueLockExecute,
})

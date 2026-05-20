// src/tools/internal/repository-get-issues.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import repositoryGetIssuesExecute from './repository-get-issues.tool.server'

export const githubRepositoryGetIssuesTool = defineTool({
  id: 'github_repository_get_issues',
  name: 'GitHub: list repo issues (block)',
  description: 'Internal — backs the GitHub workflow block (repository.getIssues).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: repositoryGetIssuesExecute,
})

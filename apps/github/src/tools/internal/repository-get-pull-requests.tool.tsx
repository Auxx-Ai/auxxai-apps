// src/tools/internal/repository-get-pull-requests.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import repositoryGetPullRequestsExecute from './repository-get-pull-requests.tool.server'

export const githubRepositoryGetPullRequestsTool = defineTool({
  id: 'github_repository_get_pull_requests',
  name: 'GitHub: list repo pull requests (block)',
  description: 'Internal — backs the GitHub workflow block (repository.getPullRequests).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: repositoryGetPullRequestsExecute,
})

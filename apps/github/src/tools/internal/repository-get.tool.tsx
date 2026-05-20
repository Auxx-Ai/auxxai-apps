// src/tools/internal/repository-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import repositoryGetExecute from './repository-get.tool.server'

export const githubRepositoryGetTool = defineTool({
  id: 'github_repository_get',
  name: 'GitHub: get repository (block)',
  description: 'Internal — backs the GitHub workflow block (repository.get).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: repositoryGetExecute,
})

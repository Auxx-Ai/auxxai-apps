// src/tools/internal/release-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import releaseGetManyExecute from './release-get-many.tool.server'

export const githubReleaseGetManyTool = defineTool({
  id: 'github_release_get_many',
  name: 'GitHub: list releases (block)',
  description: 'Internal — backs the GitHub workflow block (release.getMany).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: releaseGetManyExecute,
})

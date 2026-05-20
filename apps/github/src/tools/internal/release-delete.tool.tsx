// src/tools/internal/release-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import releaseDeleteExecute from './release-delete.tool.server'

export const githubReleaseDeleteTool = defineTool({
  id: 'github_release_delete',
  name: 'GitHub: delete release (block)',
  description: 'Internal — backs the GitHub workflow block (release.delete).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: releaseDeleteExecute,
})

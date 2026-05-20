// src/tools/internal/release-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import releaseUpdateExecute from './release-update.tool.server'

export const githubReleaseUpdateTool = defineTool({
  id: 'github_release_update',
  name: 'GitHub: update release (block)',
  description: 'Internal — backs the GitHub workflow block (release.update).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: releaseUpdateExecute,
})

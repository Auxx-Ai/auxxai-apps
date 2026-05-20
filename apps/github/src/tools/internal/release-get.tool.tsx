// src/tools/internal/release-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import releaseGetExecute from './release-get.tool.server'

export const githubReleaseGetTool = defineTool({
  id: 'github_release_get',
  name: 'GitHub: get release (block)',
  description: 'Internal — backs the GitHub workflow block (release.get).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: releaseGetExecute,
})

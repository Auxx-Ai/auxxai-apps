// src/tools/internal/release-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import releaseCreateExecute from './release-create.tool.server'

export const githubReleaseCreateTool = defineTool({
  id: 'github_release_create',
  name: 'GitHub: create release (block)',
  description: 'Internal — backs the GitHub workflow block (release.create).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: releaseCreateExecute,
})

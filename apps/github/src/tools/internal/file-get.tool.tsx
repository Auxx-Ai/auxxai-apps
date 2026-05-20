// src/tools/internal/file-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import fileGetExecute from './file-get.tool.server'

export const githubFileGetTool = defineTool({
  id: 'github_file_get',
  name: 'GitHub: get file (block)',
  description: 'Internal — backs the GitHub workflow block (file.get).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: fileGetExecute,
})

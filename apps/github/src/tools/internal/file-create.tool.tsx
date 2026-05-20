// src/tools/internal/file-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import fileCreateExecute from './file-create.tool.server'

export const githubFileCreateTool = defineTool({
  id: 'github_file_create',
  name: 'GitHub: create file (block)',
  description: 'Internal — backs the GitHub workflow block (file.create).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: fileCreateExecute,
})

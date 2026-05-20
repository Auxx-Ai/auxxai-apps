// src/tools/internal/file-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import fileDeleteExecute from './file-delete.tool.server'

export const githubFileDeleteTool = defineTool({
  id: 'github_file_delete',
  name: 'GitHub: delete file (block)',
  description: 'Internal — backs the GitHub workflow block (file.delete).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: fileDeleteExecute,
})

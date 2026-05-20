// src/tools/internal/file-list.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import fileListExecute from './file-list.tool.server'

export const githubFileListTool = defineTool({
  id: 'github_file_list',
  name: 'GitHub: list files (block)',
  description: 'Internal — backs the GitHub workflow block (file.list).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: fileListExecute,
})

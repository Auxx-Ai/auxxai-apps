// src/tools/internal/file-edit.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import fileEditExecute from './file-edit.tool.server'

export const githubFileEditTool = defineTool({
  id: 'github_file_edit',
  name: 'GitHub: edit file (block)',
  description: 'Internal — backs the GitHub workflow block (file.edit).',
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: fileEditExecute,
})

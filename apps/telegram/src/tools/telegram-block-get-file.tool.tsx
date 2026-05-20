// src/tools/telegram-block-get-file.tool.tsx
//
// Internal-only tool — backs the Telegram block's `file.get` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockGetFileExecute from './telegram-block-get-file.tool.server'

export const telegramBlockGetFileTool = defineTool({
  id: 'telegram_block_get_file',
  name: 'Telegram: get file (block)',
  description: 'Internal — backs the Telegram block file.get operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      getFileId: z.string(),
    })
    .passthrough(),
  outputs: z
    .object({
      fileId: z.string(),
      downloadUrl: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockGetFileExecute,
})

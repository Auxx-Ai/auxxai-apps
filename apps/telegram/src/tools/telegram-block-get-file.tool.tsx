// src/tools/telegram-block-get-file.tool.tsx
//
// Internal-only tool — backs the Telegram block's `file.get` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { getFileInputs, getFileOutputs } from './schemas/file'
import telegramBlockGetFileExecute from './telegram-block-get-file.tool.server'

export const telegramBlockGetFileTool = defineTool({
  id: 'telegram_block_get_file',
  name: 'Telegram: get file (block)',
  description: 'Internal — backs the Telegram block file.get operation.',
  icon: telegramIcon,
  inputs: getFileInputs,
  outputs: getFileOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockGetFileExecute,
})

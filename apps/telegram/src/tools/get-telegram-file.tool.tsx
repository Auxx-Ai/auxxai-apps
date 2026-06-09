// src/tools/get-telegram-file.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import getTelegramFileExecute from './get-telegram-file.tool.server'

export const getTelegramFileTool = defineTool({
  id: 'get_telegram_file',
  name: 'Get Telegram file',
  description:
    'Resolve a Telegram file id (from an incoming message attachment) into a download URL. Use when the bot needs to fetch a photo, document, voice note, or other media a user sent.',
  icon: telegramIcon,
  inputs: z.object({
    fileId: z
      .string()
      .describe('File id from an incoming message attachment (photo, document, voice, etc.).'),
  }),
  outputs: z.object({
    fileId: z.string(),
    fileUniqueId: z.string(),
    fileSize: z.number().nullable(),
    filePath: z.string().nullable(),
    downloadUrl: z
      .string()
      .nullable()
      .describe(
        'Constructed download URL: https://api.telegram.org/file/bot{token}/{filePath}. Null if Telegram did not return a filePath (rare).'
      ),
  }),
  exampleOutput: {
    fileId: 'BAADBAADrwADBREAAYag2nQOAAEC',
    fileUniqueId: 'AgADrwADBREAAQ',
    fileSize: 24680,
    filePath: 'documents/file_12.pdf',
    downloadUrl:
      'https://api.telegram.org/file/bot123456:ABC-DEF1234ghIkl/documents/file_12.pdf',
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getTelegramFileExecute,
  agent: { toolsetSlug: 'telegram.chats.read' },
})

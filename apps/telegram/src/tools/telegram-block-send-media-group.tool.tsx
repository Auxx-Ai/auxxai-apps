// src/tools/telegram-block-send-media-group.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendMediaGroup` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockSendMediaGroupExecute from './telegram-block-send-media-group.tool.server'

export const telegramBlockSendMediaGroupTool = defineTool({
  id: 'telegram_block_send_media_group',
  name: 'Telegram: send media group (block)',
  description: 'Internal — backs the Telegram block message.sendMediaGroup operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      sendMediaGroupChatId: z.string(),
      sendMediaGroupMedia: z.string(),
      sendMediaGroupDisableNotification: z.boolean().optional(),
      sendMediaGroupReplyToMessageId: z.string().optional(),
      sendMediaGroupThreadId: z.string().optional(),
    })
    .passthrough(),
  outputs: z
    .object({
      count: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: telegramBlockSendMediaGroupExecute,
})

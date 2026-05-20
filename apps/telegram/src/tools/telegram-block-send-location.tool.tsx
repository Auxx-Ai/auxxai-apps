// src/tools/telegram-block-send-location.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendLocation` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockSendLocationExecute from './telegram-block-send-location.tool.server'

export const telegramBlockSendLocationTool = defineTool({
  id: 'telegram_block_send_location',
  name: 'Telegram: send location (block)',
  description: 'Internal — backs the Telegram block message.sendLocation operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      sendLocationChatId: z.string(),
      sendLocationLatitude: z.union([z.string(), z.number()]),
      sendLocationLongitude: z.union([z.string(), z.number()]),
      sendLocationDisableNotification: z.boolean().optional(),
      sendLocationReplyToMessageId: z.string().optional(),
      sendLocationThreadId: z.string().optional(),
      sendLocationReplyMarkup: z.string().optional(),
    })
    .passthrough(),
  outputs: z
    .object({
      messageId: z.string(),
      chatId: z.string(),
      date: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: telegramBlockSendLocationExecute,
})

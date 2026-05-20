// src/tools/telegram-block-send-sticker.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendSticker` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockSendStickerExecute from './telegram-block-send-sticker.tool.server'

export const telegramBlockSendStickerTool = defineTool({
  id: 'telegram_block_send_sticker',
  name: 'Telegram: send sticker (block)',
  description: 'Internal — backs the Telegram block message.sendSticker operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      sendStickerChatId: z.string(),
      sendStickerFile: z.string(),
      sendStickerDisableNotification: z.boolean().optional(),
      sendStickerReplyToMessageId: z.string().optional(),
      sendStickerThreadId: z.string().optional(),
      sendStickerReplyMarkup: z.string().optional(),
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
  execute: telegramBlockSendStickerExecute,
})

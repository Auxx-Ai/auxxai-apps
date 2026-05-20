// src/tools/telegram-block-send-photo.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendPhoto` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockSendPhotoExecute from './telegram-block-send-photo.tool.server'

export const telegramBlockSendPhotoTool = defineTool({
  id: 'telegram_block_send_photo',
  name: 'Telegram: send photo (block)',
  description: 'Internal — backs the Telegram block message.sendPhoto operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      sendPhotoChatId: z.string(),
      sendPhotoFile: z.string(),
      sendPhotoCaption: z.string().optional(),
      sendPhotoParseMode: z.string().optional(),
      sendPhotoDisableNotification: z.boolean().optional(),
      sendPhotoReplyToMessageId: z.string().optional(),
      sendPhotoThreadId: z.string().optional(),
      sendPhotoReplyMarkup: z.string().optional(),
    })
    .passthrough(),
  outputs: z
    .object({
      messageId: z.string(),
      chatId: z.string(),
      caption: z.string(),
      date: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: telegramBlockSendPhotoExecute,
})

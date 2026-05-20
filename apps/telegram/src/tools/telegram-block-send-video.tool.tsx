// src/tools/telegram-block-send-video.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendVideo` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockSendVideoExecute from './telegram-block-send-video.tool.server'

export const telegramBlockSendVideoTool = defineTool({
  id: 'telegram_block_send_video',
  name: 'Telegram: send video (block)',
  description: 'Internal — backs the Telegram block message.sendVideo operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      sendVideoChatId: z.string(),
      sendVideoFile: z.string(),
      sendVideoCaption: z.string().optional(),
      sendVideoParseMode: z.string().optional(),
      sendVideoDuration: z.number().optional(),
      sendVideoWidth: z.number().optional(),
      sendVideoHeight: z.number().optional(),
      sendVideoDisableNotification: z.boolean().optional(),
      sendVideoReplyToMessageId: z.string().optional(),
      sendVideoThreadId: z.string().optional(),
      sendVideoReplyMarkup: z.string().optional(),
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
  execute: telegramBlockSendVideoExecute,
})

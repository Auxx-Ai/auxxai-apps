// src/tools/telegram-block-send-animation.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendAnimation` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockSendAnimationExecute from './telegram-block-send-animation.tool.server'

export const telegramBlockSendAnimationTool = defineTool({
  id: 'telegram_block_send_animation',
  name: 'Telegram: send animation (block)',
  description: 'Internal — backs the Telegram block message.sendAnimation operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      sendAnimationChatId: z.string(),
      sendAnimationFile: z.string(),
      sendAnimationCaption: z.string().optional(),
      sendAnimationParseMode: z.string().optional(),
      sendAnimationDuration: z.number().optional(),
      sendAnimationWidth: z.number().optional(),
      sendAnimationHeight: z.number().optional(),
      sendAnimationDisableNotification: z.boolean().optional(),
      sendAnimationReplyToMessageId: z.string().optional(),
      sendAnimationThreadId: z.string().optional(),
      sendAnimationReplyMarkup: z.string().optional(),
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
  execute: telegramBlockSendAnimationExecute,
})

// src/tools/telegram-block-send-audio.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendAudio` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockSendAudioExecute from './telegram-block-send-audio.tool.server'

export const telegramBlockSendAudioTool = defineTool({
  id: 'telegram_block_send_audio',
  name: 'Telegram: send audio (block)',
  description: 'Internal — backs the Telegram block message.sendAudio operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      sendAudioChatId: z.string(),
      sendAudioFile: z.string(),
      sendAudioCaption: z.string().optional(),
      sendAudioParseMode: z.string().optional(),
      sendAudioDuration: z.number().optional(),
      sendAudioPerformer: z.string().optional(),
      sendAudioTitle: z.string().optional(),
      sendAudioDisableNotification: z.boolean().optional(),
      sendAudioReplyToMessageId: z.string().optional(),
      sendAudioThreadId: z.string().optional(),
      sendAudioReplyMarkup: z.string().optional(),
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
  execute: telegramBlockSendAudioExecute,
})

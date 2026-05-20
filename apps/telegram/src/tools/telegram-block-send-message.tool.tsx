// src/tools/telegram-block-send-message.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendMessage` op.
// No `agent` / `action` surface keys: invoked solely via the block's
// dispatcher through `ctx.runTool`.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockSendMessageExecute from './telegram-block-send-message.tool.server'

export const telegramBlockSendMessageTool = defineTool({
  id: 'telegram_block_send_message',
  name: 'Telegram: send message (block)',
  description: 'Internal — backs the Telegram block message.sendMessage operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      sendMessageChatId: z.string(),
      sendMessageText: z.string(),
      sendMessageParseMode: z.string().optional(),
      sendMessageDisablePreview: z.boolean().optional(),
      sendMessageDisableNotification: z.boolean().optional(),
      sendMessageReplyToMessageId: z.string().optional(),
      sendMessageThreadId: z.string().optional(),
      sendMessageReplyMarkup: z.string().optional(),
    })
    .passthrough(),
  outputs: z
    .object({
      messageId: z.string(),
      chatId: z.string(),
      text: z.string(),
      date: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: telegramBlockSendMessageExecute,
})

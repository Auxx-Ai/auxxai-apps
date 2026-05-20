// src/tools/reply-to-telegram-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import replyToTelegramMessageExecute from './reply-to-telegram-message.tool.server'

export const replyToTelegramMessageTool = defineTool({
  id: 'reply_to_telegram_message',
  name: 'Reply to Telegram message',
  description:
    'Send a text reply that threads under an existing Telegram message. Use this (instead of send_telegram_message) when the agent is responding in-thread to a specific message id.',
  icon: telegramIcon,
  inputs: z.object({
    chatId: z.string(),
    messageId: z
      .string()
      .describe('Id of the message to reply to (typically from trigger context).'),
    text: z.string().min(1).max(4096),
    parseMode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
    disableLinkPreview: z.boolean().optional(),
    disableNotification: z.boolean().optional(),
    messageThreadId: z.string().optional(),
  }),
  outputs: z.object({
    messageId: z.string(),
    chatId: z.string(),
    text: z.string(),
    date: z.string(),
    replyToMessageId: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: replyToTelegramMessageExecute,
  agent: { toolsetSlug: 'telegram.messages.write' },
})

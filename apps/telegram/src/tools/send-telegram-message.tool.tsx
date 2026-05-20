// src/tools/send-telegram-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import sendTelegramMessageExecute from './send-telegram-message.tool.server'

export const sendTelegramMessageTool = defineTool({
  id: 'send_telegram_message',
  name: 'Send Telegram message',
  description:
    'Post a new text message to a Telegram chat. Use replyToMessageId-based tools instead if you want to thread under an existing message. Enabling this toolset on an agent is the authorization to post.',
  icon: telegramIcon,
  inputs: z.object({
    chatId: z.string().describe('Chat id (typically from the trigger context) or @username.'),
    text: z
      .string()
      .min(1)
      .max(4096)
      .describe('Message body. Up to 4096 characters per Telegram limit.'),
    parseMode: z
      .enum(['HTML', 'Markdown', 'MarkdownV2'])
      .optional()
      .describe('Formatting mode. Default HTML (more forgiving than MarkdownV2).'),
    disableLinkPreview: z
      .boolean()
      .optional()
      .describe('Suppress the link preview card. Default false.'),
    disableNotification: z
      .boolean()
      .optional()
      .describe('Send silently — recipients get no notification sound. Default false.'),
    messageThreadId: z
      .string()
      .optional()
      .describe('Forum topic id for supergroups with topics enabled. Omit otherwise.'),
  }),
  outputs: z.object({
    messageId: z.string(),
    chatId: z.string(),
    text: z.string(),
    date: z.string().describe('ISO 8601 timestamp.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: sendTelegramMessageExecute,
  agent: { toolsetSlug: 'telegram.messages.write' },
})

// src/tools/edit-telegram-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import editTelegramMessageExecute from './edit-telegram-message.tool.server'

export const editTelegramMessageTool = defineTool({
  id: 'edit_telegram_message',
  name: 'Edit Telegram message',
  description:
    'Replace the text of a Telegram message the bot itself sent. Cannot edit messages from other users. Bots can edit their own messages indefinitely.',
  icon: telegramIcon,
  inputs: z.object({
    chatId: z.string(),
    messageId: z
      .string()
      .describe('Id of the message to edit. Must be a message the bot itself sent.'),
    text: z.string().min(1).max(4096).describe('Replacement text.'),
    parseMode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
    disableLinkPreview: z.boolean().optional(),
  }),
  outputs: z.object({
    messageId: z.string(),
    chatId: z.string(),
    text: z.string(),
    editDate: z.string().describe('ISO 8601 timestamp of the edit.'),
  }),
  exampleOutput: {
    messageId: '4521',
    chatId: '123456789',
    text: 'Updated: your order has shipped and is on its way.',
    editDate: '2026-06-08T14:32:00Z',
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: editTelegramMessageExecute,
  agent: { toolsetSlug: 'telegram.messages.write' },
})

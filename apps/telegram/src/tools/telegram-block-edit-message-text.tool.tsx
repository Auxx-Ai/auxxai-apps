// src/tools/telegram-block-edit-message-text.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.editMessageText` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockEditMessageTextExecute from './telegram-block-edit-message-text.tool.server'

export const telegramBlockEditMessageTextTool = defineTool({
  id: 'telegram_block_edit_message_text',
  name: 'Telegram: edit message text (block)',
  description: 'Internal — backs the Telegram block message.editMessageText operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      editTextMessageType: z.string().optional(),
      editTextChatId: z.string().optional(),
      editTextMessageId: z.string().optional(),
      editTextInlineMessageId: z.string().optional(),
      editTextText: z.string(),
      editTextParseMode: z.string().optional(),
      editTextDisablePreview: z.boolean().optional(),
      editTextReplyMarkup: z.string().optional(),
    })
    .passthrough(),
  outputs: z
    .object({
      messageId: z.string(),
      chatId: z.string(),
      text: z.string(),
      editDate: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: telegramBlockEditMessageTextExecute,
})

// src/tools/telegram-block-send-document.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendDocument` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockSendDocumentExecute from './telegram-block-send-document.tool.server'

export const telegramBlockSendDocumentTool = defineTool({
  id: 'telegram_block_send_document',
  name: 'Telegram: send document (block)',
  description: 'Internal — backs the Telegram block message.sendDocument operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      sendDocChatId: z.string(),
      sendDocFile: z.string(),
      sendDocCaption: z.string().optional(),
      sendDocParseMode: z.string().optional(),
      sendDocDisableNotification: z.boolean().optional(),
      sendDocReplyToMessageId: z.string().optional(),
      sendDocThreadId: z.string().optional(),
      sendDocReplyMarkup: z.string().optional(),
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
  execute: telegramBlockSendDocumentExecute,
})

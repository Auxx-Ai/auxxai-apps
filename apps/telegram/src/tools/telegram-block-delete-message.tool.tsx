// src/tools/telegram-block-delete-message.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.deleteMessage` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockDeleteMessageExecute from './telegram-block-delete-message.tool.server'

export const telegramBlockDeleteMessageTool = defineTool({
  id: 'telegram_block_delete_message',
  name: 'Telegram: delete message (block)',
  description: 'Internal — backs the Telegram block message.deleteMessage operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      deleteChatId: z.string(),
      deleteMessageId: z.string(),
    })
    .passthrough(),
  outputs: z.object({ success: z.string() }).passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockDeleteMessageExecute,
})

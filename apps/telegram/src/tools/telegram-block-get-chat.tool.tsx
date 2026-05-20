// src/tools/telegram-block-get-chat.tool.tsx
//
// Internal-only tool — backs the Telegram block's `chat.get` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockGetChatExecute from './telegram-block-get-chat.tool.server'

export const telegramBlockGetChatTool = defineTool({
  id: 'telegram_block_get_chat',
  name: 'Telegram: get chat (block)',
  description: 'Internal — backs the Telegram block chat.get operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      getChatChatId: z.string(),
    })
    .passthrough(),
  outputs: z
    .object({
      chatId: z.string(),
      type: z.string(),
      title: z.string(),
      username: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockGetChatExecute,
})

// src/tools/telegram-block-set-chat-title.tool.tsx
//
// Internal-only tool — backs the Telegram block's `chat.setTitle` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockSetChatTitleExecute from './telegram-block-set-chat-title.tool.server'

export const telegramBlockSetChatTitleTool = defineTool({
  id: 'telegram_block_set_chat_title',
  name: 'Telegram: set chat title (block)',
  description: 'Internal — backs the Telegram block chat.setTitle operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      setTitleChatId: z.string(),
      setTitleTitle: z.string(),
    })
    .passthrough(),
  outputs: z.object({ success: z.string() }).passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockSetChatTitleExecute,
})

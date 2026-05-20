// src/tools/telegram-block-leave-chat.tool.tsx
//
// Internal-only tool — backs the Telegram block's `chat.leave` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockLeaveChatExecute from './telegram-block-leave-chat.tool.server'

export const telegramBlockLeaveChatTool = defineTool({
  id: 'telegram_block_leave_chat',
  name: 'Telegram: leave chat (block)',
  description: 'Internal — backs the Telegram block chat.leave operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      leaveChatId: z.string(),
    })
    .passthrough(),
  outputs: z.object({ success: z.string() }).passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockLeaveChatExecute,
})

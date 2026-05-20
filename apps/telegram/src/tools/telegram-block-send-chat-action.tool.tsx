// src/tools/telegram-block-send-chat-action.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendChatAction` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockSendChatActionExecute from './telegram-block-send-chat-action.tool.server'

export const telegramBlockSendChatActionTool = defineTool({
  id: 'telegram_block_send_chat_action',
  name: 'Telegram: send chat action (block)',
  description: 'Internal — backs the Telegram block message.sendChatAction operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      sendActionChatId: z.string(),
      sendActionAction: z.string().optional(),
      sendActionThreadId: z.string().optional(),
    })
    .passthrough(),
  outputs: z.object({ success: z.string() }).passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockSendChatActionExecute,
})

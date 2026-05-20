// src/tools/telegram-block-get-chat-administrators.tool.tsx
//
// Internal-only tool — backs the Telegram block's `chat.getAdministrators` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockGetChatAdministratorsExecute from './telegram-block-get-chat-administrators.tool.server'

export const telegramBlockGetChatAdministratorsTool = defineTool({
  id: 'telegram_block_get_chat_administrators',
  name: 'Telegram: get chat administrators (block)',
  description: 'Internal — backs the Telegram block chat.getAdministrators operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      getAdminsChatId: z.string(),
    })
    .passthrough(),
  outputs: z
    .object({
      count: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockGetChatAdministratorsExecute,
})

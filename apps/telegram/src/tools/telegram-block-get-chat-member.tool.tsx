// src/tools/telegram-block-get-chat-member.tool.tsx
//
// Internal-only tool — backs the Telegram block's `chat.getMember` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockGetChatMemberExecute from './telegram-block-get-chat-member.tool.server'

export const telegramBlockGetChatMemberTool = defineTool({
  id: 'telegram_block_get_chat_member',
  name: 'Telegram: get chat member (block)',
  description: 'Internal — backs the Telegram block chat.getMember operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      getMemberChatId: z.string(),
      getMemberUserId: z.string(),
    })
    .passthrough(),
  outputs: z
    .object({
      status: z.string(),
      userId: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockGetChatMemberExecute,
})

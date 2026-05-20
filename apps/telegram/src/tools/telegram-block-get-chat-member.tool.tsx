// src/tools/telegram-block-get-chat-member.tool.tsx
//
// Internal-only tool — backs the Telegram block's `chat.getMember` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { getChatMemberInputs, getChatMemberOutputs } from './schemas/chat'
import telegramBlockGetChatMemberExecute from './telegram-block-get-chat-member.tool.server'

export const telegramBlockGetChatMemberTool = defineTool({
  id: 'telegram_block_get_chat_member',
  name: 'Telegram: get chat member (block)',
  description: 'Internal — backs the Telegram block chat.getMember operation.',
  icon: telegramIcon,
  inputs: getChatMemberInputs,
  outputs: getChatMemberOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockGetChatMemberExecute,
})

// src/tools/telegram-block-leave-chat.tool.tsx
//
// Internal-only tool — backs the Telegram block's `chat.leave` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { leaveChatInputs, leaveChatOutputs } from './schemas/chat'
import telegramBlockLeaveChatExecute from './telegram-block-leave-chat.tool.server'

export const telegramBlockLeaveChatTool = defineTool({
  id: 'telegram_block_leave_chat',
  name: 'Telegram: leave chat (block)',
  description: 'Internal — backs the Telegram block chat.leave operation.',
  icon: telegramIcon,
  inputs: leaveChatInputs,
  outputs: leaveChatOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockLeaveChatExecute,
})

// src/tools/telegram-block-send-chat-action.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendChatAction` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { sendChatActionInputs, sendChatActionOutputs } from './schemas/message'
import telegramBlockSendChatActionExecute from './telegram-block-send-chat-action.tool.server'

export const telegramBlockSendChatActionTool = defineTool({
  id: 'telegram_block_send_chat_action',
  name: 'Telegram: send chat action (block)',
  description: 'Internal — backs the Telegram block message.sendChatAction operation.',
  icon: telegramIcon,
  inputs: sendChatActionInputs,
  outputs: sendChatActionOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockSendChatActionExecute,
})

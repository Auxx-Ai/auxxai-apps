// src/tools/telegram-block-set-chat-description.tool.tsx
//
// Internal-only tool — backs the Telegram block's `chat.setDescription` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { setChatDescriptionInputs, setChatDescriptionOutputs } from './schemas/chat'
import telegramBlockSetChatDescriptionExecute from './telegram-block-set-chat-description.tool.server'

export const telegramBlockSetChatDescriptionTool = defineTool({
  id: 'telegram_block_set_chat_description',
  name: 'Telegram: set chat description (block)',
  description: 'Internal — backs the Telegram block chat.setDescription operation.',
  icon: telegramIcon,
  inputs: setChatDescriptionInputs,
  outputs: setChatDescriptionOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockSetChatDescriptionExecute,
})

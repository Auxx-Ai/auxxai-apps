// src/tools/telegram-block-delete-message.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.deleteMessage` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { deleteMessageInputs, deleteMessageOutputs } from './schemas/message'
import telegramBlockDeleteMessageExecute from './telegram-block-delete-message.tool.server'

export const telegramBlockDeleteMessageTool = defineTool({
  id: 'telegram_block_delete_message',
  name: 'Telegram: delete message (block)',
  description: 'Internal — backs the Telegram block message.deleteMessage operation.',
  icon: telegramIcon,
  inputs: deleteMessageInputs,
  outputs: deleteMessageOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockDeleteMessageExecute,
})

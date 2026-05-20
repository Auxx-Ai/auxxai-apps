// src/tools/telegram-block-edit-message-text.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.editMessageText` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { editMessageTextInputs, editMessageTextOutputs } from './schemas/message'
import telegramBlockEditMessageTextExecute from './telegram-block-edit-message-text.tool.server'

export const telegramBlockEditMessageTextTool = defineTool({
  id: 'telegram_block_edit_message_text',
  name: 'Telegram: edit message text (block)',
  description: 'Internal — backs the Telegram block message.editMessageText operation.',
  icon: telegramIcon,
  inputs: editMessageTextInputs,
  outputs: editMessageTextOutputs,
  config: { requiresConnection: true, timeout: 15000 },
  execute: telegramBlockEditMessageTextExecute,
})

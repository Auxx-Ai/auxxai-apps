// src/tools/telegram-block-send-media-group.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendMediaGroup` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { sendMediaGroupInputs, sendMediaGroupOutputs } from './schemas/message'
import telegramBlockSendMediaGroupExecute from './telegram-block-send-media-group.tool.server'

export const telegramBlockSendMediaGroupTool = defineTool({
  id: 'telegram_block_send_media_group',
  name: 'Telegram: send media group (block)',
  description: 'Internal — backs the Telegram block message.sendMediaGroup operation.',
  icon: telegramIcon,
  inputs: sendMediaGroupInputs,
  outputs: sendMediaGroupOutputs,
  config: { requiresConnection: true, timeout: 30000 },
  execute: telegramBlockSendMediaGroupExecute,
})

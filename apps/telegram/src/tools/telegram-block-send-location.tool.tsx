// src/tools/telegram-block-send-location.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendLocation` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { sendLocationInputs, sendLocationOutputs } from './schemas/message'
import telegramBlockSendLocationExecute from './telegram-block-send-location.tool.server'

export const telegramBlockSendLocationTool = defineTool({
  id: 'telegram_block_send_location',
  name: 'Telegram: send location (block)',
  description: 'Internal — backs the Telegram block message.sendLocation operation.',
  icon: telegramIcon,
  inputs: sendLocationInputs,
  outputs: sendLocationOutputs,
  config: { requiresConnection: true, timeout: 15000 },
  execute: telegramBlockSendLocationExecute,
})

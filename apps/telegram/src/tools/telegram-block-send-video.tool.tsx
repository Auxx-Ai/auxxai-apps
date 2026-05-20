// src/tools/telegram-block-send-video.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendVideo` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { sendVideoInputs, sendVideoOutputs } from './schemas/message'
import telegramBlockSendVideoExecute from './telegram-block-send-video.tool.server'

export const telegramBlockSendVideoTool = defineTool({
  id: 'telegram_block_send_video',
  name: 'Telegram: send video (block)',
  description: 'Internal — backs the Telegram block message.sendVideo operation.',
  icon: telegramIcon,
  inputs: sendVideoInputs,
  outputs: sendVideoOutputs,
  config: { requiresConnection: true, timeout: 30000 },
  execute: telegramBlockSendVideoExecute,
})

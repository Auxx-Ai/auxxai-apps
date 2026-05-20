// src/tools/telegram-block-send-sticker.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendSticker` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { sendStickerInputs, sendStickerOutputs } from './schemas/message'
import telegramBlockSendStickerExecute from './telegram-block-send-sticker.tool.server'

export const telegramBlockSendStickerTool = defineTool({
  id: 'telegram_block_send_sticker',
  name: 'Telegram: send sticker (block)',
  description: 'Internal — backs the Telegram block message.sendSticker operation.',
  icon: telegramIcon,
  inputs: sendStickerInputs,
  outputs: sendStickerOutputs,
  config: { requiresConnection: true, timeout: 15000 },
  execute: telegramBlockSendStickerExecute,
})

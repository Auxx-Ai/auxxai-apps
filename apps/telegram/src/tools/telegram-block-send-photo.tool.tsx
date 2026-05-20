// src/tools/telegram-block-send-photo.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendPhoto` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { sendPhotoInputs, sendPhotoOutputs } from './schemas/message'
import telegramBlockSendPhotoExecute from './telegram-block-send-photo.tool.server'

export const telegramBlockSendPhotoTool = defineTool({
  id: 'telegram_block_send_photo',
  name: 'Telegram: send photo (block)',
  description: 'Internal — backs the Telegram block message.sendPhoto operation.',
  icon: telegramIcon,
  inputs: sendPhotoInputs,
  outputs: sendPhotoOutputs,
  config: { requiresConnection: true, timeout: 30000 },
  execute: telegramBlockSendPhotoExecute,
})

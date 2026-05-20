// src/tools/telegram-block-send-audio.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendAudio` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { sendAudioInputs, sendAudioOutputs } from './schemas/message'
import telegramBlockSendAudioExecute from './telegram-block-send-audio.tool.server'

export const telegramBlockSendAudioTool = defineTool({
  id: 'telegram_block_send_audio',
  name: 'Telegram: send audio (block)',
  description: 'Internal — backs the Telegram block message.sendAudio operation.',
  icon: telegramIcon,
  inputs: sendAudioInputs,
  outputs: sendAudioOutputs,
  config: { requiresConnection: true, timeout: 30000 },
  execute: telegramBlockSendAudioExecute,
})

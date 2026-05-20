// src/tools/telegram-block-send-animation.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.sendAnimation` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { sendAnimationInputs, sendAnimationOutputs } from './schemas/message'
import telegramBlockSendAnimationExecute from './telegram-block-send-animation.tool.server'

export const telegramBlockSendAnimationTool = defineTool({
  id: 'telegram_block_send_animation',
  name: 'Telegram: send animation (block)',
  description: 'Internal — backs the Telegram block message.sendAnimation operation.',
  icon: telegramIcon,
  inputs: sendAnimationInputs,
  outputs: sendAnimationOutputs,
  config: { requiresConnection: true, timeout: 30000 },
  execute: telegramBlockSendAnimationExecute,
})

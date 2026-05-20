// src/tools/telegram-block-pin-message.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.pinMessage` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { pinMessageInputs, pinMessageOutputs } from './schemas/message'
import telegramBlockPinMessageExecute from './telegram-block-pin-message.tool.server'

export const telegramBlockPinMessageTool = defineTool({
  id: 'telegram_block_pin_message',
  name: 'Telegram: pin message (block)',
  description: 'Internal — backs the Telegram block message.pinMessage operation.',
  icon: telegramIcon,
  inputs: pinMessageInputs,
  outputs: pinMessageOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockPinMessageExecute,
})

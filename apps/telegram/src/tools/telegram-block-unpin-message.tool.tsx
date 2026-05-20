// src/tools/telegram-block-unpin-message.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.unpinMessage` op.

import { defineTool } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import { unpinMessageInputs, unpinMessageOutputs } from './schemas/message'
import telegramBlockUnpinMessageExecute from './telegram-block-unpin-message.tool.server'

export const telegramBlockUnpinMessageTool = defineTool({
  id: 'telegram_block_unpin_message',
  name: 'Telegram: unpin message (block)',
  description: 'Internal — backs the Telegram block message.unpinMessage operation.',
  icon: telegramIcon,
  inputs: unpinMessageInputs,
  outputs: unpinMessageOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockUnpinMessageExecute,
})

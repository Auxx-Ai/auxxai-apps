// src/tools/telegram-block-pin-message.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.pinMessage` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockPinMessageExecute from './telegram-block-pin-message.tool.server'

export const telegramBlockPinMessageTool = defineTool({
  id: 'telegram_block_pin_message',
  name: 'Telegram: pin message (block)',
  description: 'Internal — backs the Telegram block message.pinMessage operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      pinChatId: z.string(),
      pinMessageId: z.string(),
      pinDisableNotification: z.boolean().optional(),
    })
    .passthrough(),
  outputs: z.object({ success: z.string() }).passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockPinMessageExecute,
})

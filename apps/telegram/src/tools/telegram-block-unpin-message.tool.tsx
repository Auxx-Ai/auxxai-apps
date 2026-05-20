// src/tools/telegram-block-unpin-message.tool.tsx
//
// Internal-only tool — backs the Telegram block's `message.unpinMessage` op.

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import telegramBlockUnpinMessageExecute from './telegram-block-unpin-message.tool.server'

export const telegramBlockUnpinMessageTool = defineTool({
  id: 'telegram_block_unpin_message',
  name: 'Telegram: unpin message (block)',
  description: 'Internal — backs the Telegram block message.unpinMessage operation.',
  icon: telegramIcon,
  inputs: z
    .object({
      unpinChatId: z.string(),
      unpinMessageId: z.string(),
    })
    .passthrough(),
  outputs: z.object({ success: z.string() }).passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: telegramBlockUnpinMessageExecute,
})

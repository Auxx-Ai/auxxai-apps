// src/tools/delete-telegram-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import deleteTelegramMessageExecute from './delete-telegram-message.tool.server'

export const deleteTelegramMessageTool = defineTool({
  id: 'delete_telegram_message',
  name: 'Delete Telegram message',
  description:
    'Delete a Telegram message. Bots can delete their own messages within 48 hours, or any message in a chat where they have delete permissions.',
  icon: telegramIcon,
  inputs: z.object({
    chatId: z.string(),
    messageId: z
      .string()
      .describe(
        'Id of the message to delete. Bots can delete their own messages within 48h, or any message in a chat where they have delete permissions.'
      ),
  }),
  outputs: z.object({
    deleted: z.literal(true),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: deleteTelegramMessageExecute,
})

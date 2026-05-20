// src/tools/get-telegram-chat.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import getTelegramChatExecute from './get-telegram-chat.tool.server'

export const getTelegramChatTool = defineTool({
  id: 'get_telegram_chat',
  name: 'Get Telegram chat',
  description:
    'Fetch metadata for a Telegram chat (private chat, group, supergroup, or channel) by id or @username. Use to confirm a chat exists or read its title, type, or description.',
  icon: telegramIcon,
  inputs: z.object({
    chatId: z
      .string()
      .describe('Numeric chat id (e.g. "-1001234567890") or @username (e.g. "@auxx_support").'),
  }),
  outputs: z.object({
    chatId: z.string(),
    type: z.enum(['private', 'group', 'supergroup', 'channel']),
    title: z.string().nullable(),
    username: z.string().nullable(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    description: z.string().nullable(),
    memberCount: z
      .number()
      .nullable()
      .describe(
        'Null for private chats; populated for groups/supergroups/channels when the bot can read it.'
      ),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getTelegramChatExecute,
  agent: { toolsetSlug: 'telegram.chats.read' },
})

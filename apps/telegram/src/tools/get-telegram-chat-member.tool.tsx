// src/tools/get-telegram-chat-member.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import getTelegramChatMemberExecute from './get-telegram-chat-member.tool.server'

export const getTelegramChatMemberTool = defineTool({
  id: 'get_telegram_chat_member',
  name: 'Get Telegram chat member',
  description:
    'Look up the membership status of a specific user in a Telegram chat. Returns creator / administrator / member / restricted / left / kicked.',
  icon: telegramIcon,
  inputs: z.object({
    chatId: z.string(),
    userId: z.string().describe('Telegram user id (numeric).'),
  }),
  outputs: z.object({
    status: z.enum(['creator', 'administrator', 'member', 'restricted', 'left', 'kicked']),
    userId: z.string(),
    username: z.string().nullable(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    isBot: z.boolean(),
  }),
  exampleOutput: {
    status: 'administrator',
    userId: '123456789',
    username: '@janecooper',
    firstName: 'Jane',
    lastName: 'Cooper',
    isBot: false,
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getTelegramChatMemberExecute,
  agent: { toolsetSlug: 'telegram.chats.read' },
})

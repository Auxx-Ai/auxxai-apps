// src/tools/get-telegram-chat-administrators.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import telegramIcon from '../assets/icon.png'
import getTelegramChatAdministratorsExecute from './get-telegram-chat-administrators.tool.server'

export const getTelegramChatAdministratorsTool = defineTool({
  id: 'get_telegram_chat_administrators',
  name: 'Get Telegram chat administrators',
  description:
    'List the administrators (and owner) of a Telegram group, supergroup, or channel. Private chats have no administrators.',
  icon: telegramIcon,
  inputs: z.object({
    chatId: z
      .string()
      .describe('Group, supergroup, or channel id. Private chats have no administrators.'),
  }),
  outputs: z.object({
    administrators: z.array(
      z.object({
        userId: z.string(),
        username: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        isBot: z.boolean(),
        isCreator: z.boolean().describe('True if this user is the chat creator (owner).'),
        canPostMessages: z.boolean().nullable().describe('Channel admins only.'),
        canDeleteMessages: z.boolean().nullable(),
        canPinMessages: z.boolean().nullable(),
      })
    ),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getTelegramChatAdministratorsExecute,
})

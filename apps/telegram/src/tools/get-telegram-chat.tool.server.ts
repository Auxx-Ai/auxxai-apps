// src/tools/get-telegram-chat.tool.server.ts

import { telegramApi } from '../blocks/telegram/shared/telegram-api'
import { getTelegramBotToken } from './shared/connection'
import { type MappedChat, mapChat } from './shared/map-chat'

interface GetTelegramChatInput {
  chatId: string
}

export default async function getTelegramChat(input: GetTelegramChatInput): Promise<MappedChat> {
  const token = getTelegramBotToken()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await telegramApi<any>('getChat', token, { chat_id: input.chatId })

  let memberCount: number | null = null
  if (raw?.type && raw.type !== 'private') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const count = await telegramApi<any>('getChatMemberCount', token, {
        chat_id: input.chatId,
      })
      memberCount = typeof count === 'number' ? count : null
    } catch {
      memberCount = null
    }
  }

  return mapChat(raw, memberCount)
}

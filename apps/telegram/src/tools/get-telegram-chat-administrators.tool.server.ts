// src/tools/get-telegram-chat-administrators.tool.server.ts

import { telegramApi } from '../blocks/telegram/shared/telegram-api'
import { getTelegramBotToken } from './shared/connection'
import { type MappedAdministrator, mapAdministrator } from './shared/map-administrator'

interface GetTelegramChatAdministratorsInput {
  chatId: string
}

interface GetTelegramChatAdministratorsOutput {
  administrators: MappedAdministrator[]
}

export default async function getTelegramChatAdministrators(
  input: GetTelegramChatAdministratorsInput
): Promise<GetTelegramChatAdministratorsOutput> {
  const token = getTelegramBotToken()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await telegramApi<any[]>('getChatAdministrators', token, {
    chat_id: input.chatId,
  })

  const administrators = Array.isArray(raw) ? raw.map(mapAdministrator) : []
  return { administrators }
}

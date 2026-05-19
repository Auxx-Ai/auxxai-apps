// src/tools/get-telegram-chat-member.tool.server.ts

import { telegramApi } from '../blocks/telegram/shared/telegram-api'
import { getTelegramBotToken } from './shared/connection'
import { type MappedMember, mapMember } from './shared/map-member'

interface GetTelegramChatMemberInput {
  chatId: string
  userId: string
}

export default async function getTelegramChatMember(
  input: GetTelegramChatMemberInput
): Promise<MappedMember> {
  const token = getTelegramBotToken()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await telegramApi<any>('getChatMember', token, {
    chat_id: input.chatId,
    user_id: input.userId,
  })
  return mapMember(raw)
}

// src/tools/delete-telegram-message.tool.server.ts

import { telegramApi } from '../blocks/telegram/shared/telegram-api'
import { getTelegramBotToken } from './shared/connection'

interface DeleteTelegramMessageInput {
  chatId: string
  messageId: string
}

interface DeleteTelegramMessageOutput {
  deleted: true
}

export default async function deleteTelegramMessage(
  input: DeleteTelegramMessageInput
): Promise<DeleteTelegramMessageOutput> {
  const token = getTelegramBotToken()
  await telegramApi('deleteMessage', token, {
    chat_id: input.chatId,
    message_id: Number(input.messageId) || input.messageId,
  })
  return { deleted: true }
}

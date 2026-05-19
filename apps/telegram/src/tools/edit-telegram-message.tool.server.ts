// src/tools/edit-telegram-message.tool.server.ts

import { BlockRuntimeError } from '@auxx/sdk/shared'
import { telegramApi } from '../blocks/telegram/shared/telegram-api'
import { getTelegramBotToken } from './shared/connection'
import { type MappedEditedMessage, mapEditedMessage } from './shared/map-message'

interface EditTelegramMessageInput {
  chatId: string
  messageId: string
  text: string
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disableLinkPreview?: boolean
}

export default async function editTelegramMessage(
  input: EditTelegramMessageInput
): Promise<MappedEditedMessage> {
  const text = input.text ?? ''
  if (text.length < 1 || text.length > 4096) {
    throw new BlockRuntimeError('text must be 1-4096 characters.', 'INVALID_INPUT')
  }

  const token = getTelegramBotToken()

  const params: Record<string, unknown> = {
    chat_id: input.chatId,
    message_id: Number(input.messageId) || input.messageId,
    text,
    parse_mode: input.parseMode ?? 'HTML',
  }
  if (input.disableLinkPreview) params.disable_web_page_preview = true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await telegramApi<any>('editMessageText', token, params)
  return mapEditedMessage(raw)
}

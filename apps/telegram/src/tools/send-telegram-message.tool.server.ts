// src/tools/send-telegram-message.tool.server.ts

import { BlockRuntimeError } from '@auxx/sdk/shared'
import { telegramApi } from '../blocks/telegram/shared/telegram-api'
import { getTelegramBotToken } from './shared/connection'
import { type MappedMessage, mapMessage } from './shared/map-message'

interface SendTelegramMessageInput {
  chatId: string
  text: string
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disableLinkPreview?: boolean
  disableNotification?: boolean
  messageThreadId?: string
}

export default async function sendTelegramMessage(
  input: SendTelegramMessageInput
): Promise<MappedMessage> {
  const text = input.text ?? ''
  if (text.length < 1 || text.length > 4096) {
    throw new BlockRuntimeError('text must be 1-4096 characters.', 'INVALID_INPUT')
  }

  const token = getTelegramBotToken()

  const params: Record<string, unknown> = {
    chat_id: input.chatId,
    text,
    parse_mode: input.parseMode ?? 'HTML',
  }
  if (input.disableLinkPreview) params.disable_web_page_preview = true
  if (input.disableNotification) params.disable_notification = true
  if (input.messageThreadId) params.message_thread_id = input.messageThreadId

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await telegramApi<any>('sendMessage', token, params)
  return mapMessage(raw)
}

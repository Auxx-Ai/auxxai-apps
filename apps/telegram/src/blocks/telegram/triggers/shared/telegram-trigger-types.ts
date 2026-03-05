// src/blocks/telegram/triggers/shared/telegram-trigger-types.ts

export type TelegramChatType = 'private' | 'group' | 'supergroup' | 'channel'
export type TelegramMessageType =
  | 'text'
  | 'photo'
  | 'document'
  | 'video'
  | 'audio'
  | 'sticker'
  | 'location'
  | 'callback_query'
  | 'other'

export type TelegramUpdateType =
  | 'message'
  | 'edited_message'
  | 'callback_query'
  | 'channel_post'
  | 'edited_channel_post'
  | 'other'

export function detectMessageType(message: any): TelegramMessageType {
  if (message.text) return 'text'
  if (message.photo) return 'photo'
  if (message.document) return 'document'
  if (message.video) return 'video'
  if (message.audio) return 'audio'
  if (message.sticker) return 'sticker'
  if (message.location) return 'location'
  return 'other'
}

export function detectUpdateType(update: any): TelegramUpdateType {
  if (update.message) return 'message'
  if (update.edited_message) return 'edited_message'
  if (update.callback_query) return 'callback_query'
  if (update.channel_post) return 'channel_post'
  if (update.edited_channel_post) return 'edited_channel_post'
  return 'other'
}

/**
 * Extract unified trigger data from any Telegram update type.
 * Returns a flat object with all fields, using sensible defaults for N/A fields.
 */
export function extractUpdateTriggerData(update: any) {
  const updateType = detectUpdateType(update)

  // --- Callback query ---
  if (updateType === 'callback_query') {
    const cq = update.callback_query
    return {
      updateId: update.update_id,
      updateType: 'callback_query',
      messageId: cq.message?.message_id ?? 0,
      chatId: cq.message?.chat?.id ?? 0,
      chatType: (cq.message?.chat?.type ?? '') as string,
      chatTitle: (cq.message?.chat?.title ?? '') as string,
      fromUserId: cq.from.id,
      fromUsername: cq.from.username ?? '',
      fromFirstName: cq.from.first_name ?? '',
      fromLastName: cq.from.last_name ?? '',
      text: cq.data ?? '',
      messageType: 'callback_query' as TelegramMessageType,
      callbackQueryId: cq.id,
      callbackData: cq.data ?? '',
      date: cq.message?.date ?? 0,
      replyToMessageId: 0,
      raw: update,
    }
  }

  // --- Message types (message, edited_message, channel_post, edited_channel_post) ---
  const message =
    update.message ?? update.edited_message ?? update.channel_post ?? update.edited_channel_post

  if (message) {
    return {
      updateId: update.update_id,
      updateType,
      messageId: message.message_id,
      chatId: message.chat.id,
      chatType: (message.chat.type ?? '') as string,
      chatTitle: (message.chat.title ?? '') as string,
      fromUserId: message.from?.id ?? 0,
      fromUsername: message.from?.username ?? '',
      fromFirstName: message.from?.first_name ?? '',
      fromLastName: message.from?.last_name ?? '',
      text: message.text ?? message.caption ?? '',
      messageType: detectMessageType(message),
      callbackQueryId: '',
      callbackData: '',
      date: message.date,
      replyToMessageId: message.reply_to_message?.message_id ?? 0,
      raw: update,
    }
  }

  // --- Unhandled update type ---
  return null
}

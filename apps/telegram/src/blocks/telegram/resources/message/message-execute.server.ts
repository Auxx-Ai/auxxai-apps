import { getOrganizationConnection } from '@auxx/sdk/server'
import { telegramApi, throwConnectionNotFound } from '../../shared/telegram-api'

function parseReplyMarkup(json: string | undefined): object | undefined {
  if (!json) return undefined
  try {
    return JSON.parse(json)
  } catch {
    throw new Error('Reply Markup must be valid JSON')
  }
}

export async function executeMessage(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const botToken = connection.value

  switch (operation) {
    case 'sendMessage': {
      const params: Record<string, unknown> = {
        chat_id: input.sendMessageChatId,
        text: input.sendMessageText,
        parse_mode: input.sendMessageParseMode || 'HTML',
      }
      if (input.sendMessageDisablePreview) {
        params.disable_web_page_preview = true
      }
      if (input.sendMessageDisableNotification) params.disable_notification = true
      if (input.sendMessageReplyToMessageId) {
        params.reply_to_message_id = input.sendMessageReplyToMessageId
      }
      if (input.sendMessageThreadId) {
        params.message_thread_id = input.sendMessageThreadId
      }
      const replyMarkup = parseReplyMarkup(input.sendMessageReplyMarkup)
      if (replyMarkup) params.reply_markup = replyMarkup

      const result = await telegramApi<any>('sendMessage', botToken, params)
      return {
        messageId: String(result.message_id),
        chatId: String(result.chat.id),
        text: result.text ?? '',
        date: String(result.date),
      }
    }

    case 'editMessageText': {
      const params: Record<string, unknown> = {
        text: input.editTextText,
        parse_mode: input.editTextParseMode || 'HTML',
      }
      if (input.editTextMessageType === 'inlineMessage') {
        params.inline_message_id = input.editTextInlineMessageId
      } else {
        params.chat_id = input.editTextChatId
        params.message_id = input.editTextMessageId
      }
      if (input.editTextDisablePreview) params.disable_web_page_preview = true
      const replyMarkup = parseReplyMarkup(input.editTextReplyMarkup)
      if (replyMarkup) params.reply_markup = replyMarkup

      const result = await telegramApi<any>('editMessageText', botToken, params)
      if (result === true) {
        return { messageId: '', chatId: '', text: input.editTextText, editDate: '' }
      }
      return {
        messageId: String(result.message_id),
        chatId: String(result.chat?.id ?? ''),
        text: result.text ?? '',
        editDate: String(result.edit_date ?? ''),
      }
    }

    case 'deleteMessage': {
      await telegramApi('deleteMessage', botToken, {
        chat_id: input.deleteChatId,
        message_id: input.deleteMessageId,
      })
      return { success: 'true' }
    }

    case 'pinMessage': {
      const params: Record<string, unknown> = {
        chat_id: input.pinChatId,
        message_id: input.pinMessageId,
      }
      if (input.pinDisableNotification) params.disable_notification = true
      await telegramApi('pinChatMessage', botToken, params)
      return { success: 'true' }
    }

    case 'unpinMessage': {
      await telegramApi('unpinChatMessage', botToken, {
        chat_id: input.unpinChatId,
        message_id: input.unpinMessageId,
      })
      return { success: 'true' }
    }

    case 'sendChatAction': {
      const params: Record<string, unknown> = {
        chat_id: input.sendActionChatId,
        action: input.sendActionAction || 'typing',
      }
      if (input.sendActionThreadId) params.message_thread_id = input.sendActionThreadId
      await telegramApi('sendChatAction', botToken, params)
      return { success: 'true' }
    }

    case 'sendPhoto': {
      const params: Record<string, unknown> = {
        chat_id: input.sendPhotoChatId,
        photo: input.sendPhotoFile,
      }
      if (input.sendPhotoCaption) {
        params.caption = input.sendPhotoCaption
        params.parse_mode = input.sendPhotoParseMode || 'HTML'
      }
      if (input.sendPhotoDisableNotification) params.disable_notification = true
      if (input.sendPhotoReplyToMessageId) {
        params.reply_to_message_id = input.sendPhotoReplyToMessageId
      }
      if (input.sendPhotoThreadId) params.message_thread_id = input.sendPhotoThreadId
      const replyMarkup = parseReplyMarkup(input.sendPhotoReplyMarkup)
      if (replyMarkup) params.reply_markup = replyMarkup

      const result = await telegramApi<any>('sendPhoto', botToken, params)
      return {
        messageId: String(result.message_id),
        chatId: String(result.chat.id),
        photo: result.photo ?? [],
        caption: result.caption ?? '',
        date: String(result.date),
      }
    }

    case 'sendDocument': {
      const params: Record<string, unknown> = {
        chat_id: input.sendDocChatId,
        document: input.sendDocFile,
      }
      if (input.sendDocCaption) {
        params.caption = input.sendDocCaption
        params.parse_mode = input.sendDocParseMode || 'HTML'
      }
      if (input.sendDocDisableNotification) params.disable_notification = true
      if (input.sendDocReplyToMessageId) {
        params.reply_to_message_id = input.sendDocReplyToMessageId
      }
      if (input.sendDocThreadId) params.message_thread_id = input.sendDocThreadId
      const replyMarkup = parseReplyMarkup(input.sendDocReplyMarkup)
      if (replyMarkup) params.reply_markup = replyMarkup

      const result = await telegramApi<any>('sendDocument', botToken, params)
      return {
        messageId: String(result.message_id),
        chatId: String(result.chat.id),
        document: result.document ?? {},
        caption: result.caption ?? '',
        date: String(result.date),
      }
    }

    case 'sendVideo': {
      const params: Record<string, unknown> = {
        chat_id: input.sendVideoChatId,
        video: input.sendVideoFile,
      }
      if (input.sendVideoCaption) {
        params.caption = input.sendVideoCaption
        params.parse_mode = input.sendVideoParseMode || 'HTML'
      }
      if (input.sendVideoDuration) params.duration = input.sendVideoDuration
      if (input.sendVideoWidth) params.width = input.sendVideoWidth
      if (input.sendVideoHeight) params.height = input.sendVideoHeight
      if (input.sendVideoDisableNotification) params.disable_notification = true
      if (input.sendVideoReplyToMessageId) {
        params.reply_to_message_id = input.sendVideoReplyToMessageId
      }
      if (input.sendVideoThreadId) params.message_thread_id = input.sendVideoThreadId
      const replyMarkup = parseReplyMarkup(input.sendVideoReplyMarkup)
      if (replyMarkup) params.reply_markup = replyMarkup

      const result = await telegramApi<any>('sendVideo', botToken, params)
      return {
        messageId: String(result.message_id),
        chatId: String(result.chat.id),
        video: result.video ?? {},
        caption: result.caption ?? '',
        date: String(result.date),
      }
    }

    case 'sendAudio': {
      const params: Record<string, unknown> = {
        chat_id: input.sendAudioChatId,
        audio: input.sendAudioFile,
      }
      if (input.sendAudioCaption) {
        params.caption = input.sendAudioCaption
        params.parse_mode = input.sendAudioParseMode || 'HTML'
      }
      if (input.sendAudioDuration) params.duration = input.sendAudioDuration
      if (input.sendAudioPerformer) params.performer = input.sendAudioPerformer
      if (input.sendAudioTitle) params.title = input.sendAudioTitle
      if (input.sendAudioDisableNotification) params.disable_notification = true
      if (input.sendAudioReplyToMessageId) {
        params.reply_to_message_id = input.sendAudioReplyToMessageId
      }
      if (input.sendAudioThreadId) params.message_thread_id = input.sendAudioThreadId
      const replyMarkup = parseReplyMarkup(input.sendAudioReplyMarkup)
      if (replyMarkup) params.reply_markup = replyMarkup

      const result = await telegramApi<any>('sendAudio', botToken, params)
      return {
        messageId: String(result.message_id),
        chatId: String(result.chat.id),
        audio: result.audio ?? {},
        caption: result.caption ?? '',
        date: String(result.date),
      }
    }

    case 'sendAnimation': {
      const params: Record<string, unknown> = {
        chat_id: input.sendAnimationChatId,
        animation: input.sendAnimationFile,
      }
      if (input.sendAnimationCaption) {
        params.caption = input.sendAnimationCaption
        params.parse_mode = input.sendAnimationParseMode || 'HTML'
      }
      if (input.sendAnimationDuration) params.duration = input.sendAnimationDuration
      if (input.sendAnimationWidth) params.width = input.sendAnimationWidth
      if (input.sendAnimationHeight) params.height = input.sendAnimationHeight
      if (input.sendAnimationDisableNotification) params.disable_notification = true
      if (input.sendAnimationReplyToMessageId) {
        params.reply_to_message_id = input.sendAnimationReplyToMessageId
      }
      if (input.sendAnimationThreadId) params.message_thread_id = input.sendAnimationThreadId
      const replyMarkup = parseReplyMarkup(input.sendAnimationReplyMarkup)
      if (replyMarkup) params.reply_markup = replyMarkup

      const result = await telegramApi<any>('sendAnimation', botToken, params)
      return {
        messageId: String(result.message_id),
        chatId: String(result.chat.id),
        animation: result.animation ?? {},
        caption: result.caption ?? '',
        date: String(result.date),
      }
    }

    case 'sendSticker': {
      const params: Record<string, unknown> = {
        chat_id: input.sendStickerChatId,
        sticker: input.sendStickerFile,
      }
      if (input.sendStickerDisableNotification) params.disable_notification = true
      if (input.sendStickerReplyToMessageId) {
        params.reply_to_message_id = input.sendStickerReplyToMessageId
      }
      if (input.sendStickerThreadId) params.message_thread_id = input.sendStickerThreadId
      const replyMarkup = parseReplyMarkup(input.sendStickerReplyMarkup)
      if (replyMarkup) params.reply_markup = replyMarkup

      const result = await telegramApi<any>('sendSticker', botToken, params)
      return {
        messageId: String(result.message_id),
        chatId: String(result.chat.id),
        sticker: result.sticker ?? {},
        date: String(result.date),
      }
    }

    case 'sendLocation': {
      const params: Record<string, unknown> = {
        chat_id: input.sendLocationChatId,
        latitude: Number(input.sendLocationLatitude),
        longitude: Number(input.sendLocationLongitude),
      }
      if (input.sendLocationDisableNotification) params.disable_notification = true
      if (input.sendLocationReplyToMessageId) {
        params.reply_to_message_id = input.sendLocationReplyToMessageId
      }
      if (input.sendLocationThreadId) params.message_thread_id = input.sendLocationThreadId
      const replyMarkup = parseReplyMarkup(input.sendLocationReplyMarkup)
      if (replyMarkup) params.reply_markup = replyMarkup

      const result = await telegramApi<any>('sendLocation', botToken, params)
      return {
        messageId: String(result.message_id),
        chatId: String(result.chat.id),
        location: result.location ?? {},
        date: String(result.date),
      }
    }

    case 'sendMediaGroup': {
      let media: unknown
      try {
        media = JSON.parse(input.sendMediaGroupMedia)
      } catch {
        throw new Error('Media must be a valid JSON array')
      }

      const params: Record<string, unknown> = {
        chat_id: input.sendMediaGroupChatId,
        media,
      }
      if (input.sendMediaGroupDisableNotification) params.disable_notification = true
      if (input.sendMediaGroupReplyToMessageId) {
        params.reply_to_message_id = input.sendMediaGroupReplyToMessageId
      }
      if (input.sendMediaGroupThreadId) params.message_thread_id = input.sendMediaGroupThreadId

      const result = await telegramApi<any[]>('sendMediaGroup', botToken, params)
      return {
        messages: result,
        count: String(result.length),
      }
    }

    default:
      throw new Error(`Unknown message operation: ${operation}`)
  }
}

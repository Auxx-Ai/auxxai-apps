// src/tools/schemas/message.ts

import { z } from '@auxx/sdk/tools'

// Shared output — message mutation ops (delete, pin, sendChatAction, unpin)
// return a simple success acknowledgement.
const successOutputs = z.object({ success: z.string() }).loose()

// Shared output — send-media ops with caption support
// (animation / audio / document / photo / video).
const captionedMessageAckOutputs = z
  .object({
    messageId: z.string(),
    chatId: z.string(),
    caption: z.string(),
    date: z.string(),
  })
  .loose()

// Shared output — send-* ops without caption (location, sticker).
const messageAckOutputs = z
  .object({
    messageId: z.string(),
    chatId: z.string(),
    date: z.string(),
  })
  .loose()

export const deleteMessageInputs = z
  .object({
    deleteChatId: z.string(),
    deleteMessageId: z.string(),
  })
  .loose()
export const deleteMessageOutputs = successOutputs

export const editMessageTextInputs = z
  .object({
    editTextMessageType: z.string().optional(),
    editTextChatId: z.string().optional(),
    editTextMessageId: z.string().optional(),
    editTextInlineMessageId: z.string().optional(),
    editTextText: z.string(),
    editTextParseMode: z.string().optional(),
    editTextDisablePreview: z.boolean().optional(),
    editTextReplyMarkup: z.string().optional(),
  })
  .loose()
export const editMessageTextOutputs = z
  .object({
    messageId: z.string(),
    chatId: z.string(),
    text: z.string(),
    editDate: z.string(),
  })
  .loose()

export const pinMessageInputs = z
  .object({
    pinChatId: z.string(),
    pinMessageId: z.string(),
    pinDisableNotification: z.boolean().optional(),
  })
  .loose()
export const pinMessageOutputs = successOutputs

export const sendAnimationInputs = z
  .object({
    sendAnimationChatId: z.string(),
    sendAnimationFile: z.string(),
    sendAnimationCaption: z.string().optional(),
    sendAnimationParseMode: z.string().optional(),
    sendAnimationDuration: z.number().optional(),
    sendAnimationWidth: z.number().optional(),
    sendAnimationHeight: z.number().optional(),
    sendAnimationDisableNotification: z.boolean().optional(),
    sendAnimationReplyToMessageId: z.string().optional(),
    sendAnimationThreadId: z.string().optional(),
    sendAnimationReplyMarkup: z.string().optional(),
  })
  .loose()
export const sendAnimationOutputs = captionedMessageAckOutputs

export const sendAudioInputs = z
  .object({
    sendAudioChatId: z.string(),
    sendAudioFile: z.string(),
    sendAudioCaption: z.string().optional(),
    sendAudioParseMode: z.string().optional(),
    sendAudioDuration: z.number().optional(),
    sendAudioPerformer: z.string().optional(),
    sendAudioTitle: z.string().optional(),
    sendAudioDisableNotification: z.boolean().optional(),
    sendAudioReplyToMessageId: z.string().optional(),
    sendAudioThreadId: z.string().optional(),
    sendAudioReplyMarkup: z.string().optional(),
  })
  .loose()
export const sendAudioOutputs = captionedMessageAckOutputs

export const sendChatActionInputs = z
  .object({
    sendActionChatId: z.string(),
    sendActionAction: z.string().optional(),
    sendActionThreadId: z.string().optional(),
  })
  .loose()
export const sendChatActionOutputs = successOutputs

export const sendDocumentInputs = z
  .object({
    sendDocChatId: z.string(),
    sendDocFile: z.string(),
    sendDocCaption: z.string().optional(),
    sendDocParseMode: z.string().optional(),
    sendDocDisableNotification: z.boolean().optional(),
    sendDocReplyToMessageId: z.string().optional(),
    sendDocThreadId: z.string().optional(),
    sendDocReplyMarkup: z.string().optional(),
  })
  .loose()
export const sendDocumentOutputs = captionedMessageAckOutputs

export const sendLocationInputs = z
  .object({
    sendLocationChatId: z.string(),
    sendLocationLatitude: z.union([z.string(), z.number()]),
    sendLocationLongitude: z.union([z.string(), z.number()]),
    sendLocationDisableNotification: z.boolean().optional(),
    sendLocationReplyToMessageId: z.string().optional(),
    sendLocationThreadId: z.string().optional(),
    sendLocationReplyMarkup: z.string().optional(),
  })
  .loose()
export const sendLocationOutputs = messageAckOutputs

export const sendMediaGroupInputs = z
  .object({
    sendMediaGroupChatId: z.string(),
    sendMediaGroupMedia: z.string(),
    sendMediaGroupDisableNotification: z.boolean().optional(),
    sendMediaGroupReplyToMessageId: z.string().optional(),
    sendMediaGroupThreadId: z.string().optional(),
  })
  .loose()
export const sendMediaGroupOutputs = z
  .object({
    count: z.string(),
  })
  .loose()

export const sendMessageInputs = z
  .object({
    sendMessageChatId: z.string(),
    sendMessageText: z.string(),
    sendMessageParseMode: z.string().optional(),
    sendMessageDisablePreview: z.boolean().optional(),
    sendMessageDisableNotification: z.boolean().optional(),
    sendMessageReplyToMessageId: z.string().optional(),
    sendMessageThreadId: z.string().optional(),
    sendMessageReplyMarkup: z.string().optional(),
  })
  .loose()
export const sendMessageOutputs = z
  .object({
    messageId: z.string(),
    chatId: z.string(),
    text: z.string(),
    date: z.string(),
  })
  .loose()

export const sendPhotoInputs = z
  .object({
    sendPhotoChatId: z.string(),
    sendPhotoFile: z.string(),
    sendPhotoCaption: z.string().optional(),
    sendPhotoParseMode: z.string().optional(),
    sendPhotoDisableNotification: z.boolean().optional(),
    sendPhotoReplyToMessageId: z.string().optional(),
    sendPhotoThreadId: z.string().optional(),
    sendPhotoReplyMarkup: z.string().optional(),
  })
  .loose()
export const sendPhotoOutputs = captionedMessageAckOutputs

export const sendStickerInputs = z
  .object({
    sendStickerChatId: z.string(),
    sendStickerFile: z.string(),
    sendStickerDisableNotification: z.boolean().optional(),
    sendStickerReplyToMessageId: z.string().optional(),
    sendStickerThreadId: z.string().optional(),
    sendStickerReplyMarkup: z.string().optional(),
  })
  .loose()
export const sendStickerOutputs = messageAckOutputs

export const sendVideoInputs = z
  .object({
    sendVideoChatId: z.string(),
    sendVideoFile: z.string(),
    sendVideoCaption: z.string().optional(),
    sendVideoParseMode: z.string().optional(),
    sendVideoDuration: z.number().optional(),
    sendVideoWidth: z.number().optional(),
    sendVideoHeight: z.number().optional(),
    sendVideoDisableNotification: z.boolean().optional(),
    sendVideoReplyToMessageId: z.string().optional(),
    sendVideoThreadId: z.string().optional(),
    sendVideoReplyMarkup: z.string().optional(),
  })
  .loose()
export const sendVideoOutputs = captionedMessageAckOutputs

export const unpinMessageInputs = z
  .object({
    unpinChatId: z.string(),
    unpinMessageId: z.string(),
  })
  .loose()
export const unpinMessageOutputs = successOutputs

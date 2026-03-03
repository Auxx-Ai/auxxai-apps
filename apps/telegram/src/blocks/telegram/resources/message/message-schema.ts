import { Workflow } from '@auxx/sdk'

const PARSE_MODE_OPTIONS = [
  { value: 'HTML', label: 'HTML' },
  { value: 'Markdown', label: 'Markdown' },
  { value: 'MarkdownV2', label: 'MarkdownV2' },
]

const CHAT_ACTION_OPTIONS = [
  { value: 'typing', label: 'Typing' },
  { value: 'upload_photo', label: 'Upload Photo' },
  { value: 'record_video', label: 'Record Video' },
  { value: 'upload_video', label: 'Upload Video' },
  { value: 'record_voice', label: 'Record Voice' },
  { value: 'upload_voice', label: 'Upload Voice' },
  { value: 'upload_document', label: 'Upload Document' },
  { value: 'find_location', label: 'Find Location' },
  { value: 'record_video_note', label: 'Record Video Note' },
  { value: 'upload_video_note', label: 'Upload Video Note' },
]

export { PARSE_MODE_OPTIONS, CHAT_ACTION_OPTIONS }

export const messageInputs = {
  // --- Send Message ---
  sendMessageChatId: Workflow.string({
    label: 'Chat ID',
    placeholder: 'Chat ID or @username',
    acceptsVariables: true,
  }),
  sendMessageText: Workflow.string({
    label: 'Text',
    placeholder: 'Message text',
    acceptsVariables: true,
  }),
  sendMessageParseMode: Workflow.select({
    label: 'Parse Mode',
    options: PARSE_MODE_OPTIONS,
    default: 'HTML',
  }),
  sendMessageDisablePreview: Workflow.boolean({
    label: 'Disable Link Preview',
    default: false,
  }),
  sendMessageDisableNotification: Workflow.boolean({
    label: 'Disable Notification',
    default: false,
  }),
  sendMessageReplyToMessageId: Workflow.string({
    label: 'Reply To Message ID',
    acceptsVariables: true,
  }),
  sendMessageThreadId: Workflow.string({
    label: 'Forum Topic ID',
    acceptsVariables: true,
  }),
  sendMessageReplyMarkup: Workflow.string({
    label: 'Reply Markup (JSON)',
    description: 'Inline keyboard JSON',
    acceptsVariables: true,
  }),

  // --- Edit Text ---
  editTextMessageType: Workflow.select({
    label: 'Message Type',
    options: [
      { value: 'message', label: 'Message' },
      { value: 'inlineMessage', label: 'Inline Message' },
    ],
    default: 'message',
  }),
  editTextChatId: Workflow.string({
    label: 'Chat ID',
    placeholder: 'Chat ID or @username',
    acceptsVariables: true,
  }),
  editTextMessageId: Workflow.string({
    label: 'Message ID',
    acceptsVariables: true,
  }),
  editTextInlineMessageId: Workflow.string({
    label: 'Inline Message ID',
    acceptsVariables: true,
  }),
  editTextText: Workflow.string({
    label: 'New Text',
    acceptsVariables: true,
  }),
  editTextParseMode: Workflow.select({
    label: 'Parse Mode',
    options: PARSE_MODE_OPTIONS,
    default: 'HTML',
  }),
  editTextDisablePreview: Workflow.boolean({
    label: 'Disable Link Preview',
    default: false,
  }),
  editTextReplyMarkup: Workflow.string({
    label: 'Reply Markup (JSON)',
    acceptsVariables: true,
  }),

  // --- Delete ---
  deleteChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  deleteMessageId: Workflow.string({
    label: 'Message ID',
    acceptsVariables: true,
  }),

  // --- Pin ---
  pinChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  pinMessageId: Workflow.string({
    label: 'Message ID',
    acceptsVariables: true,
  }),
  pinDisableNotification: Workflow.boolean({
    label: 'Disable Notification',
    default: false,
  }),

  // --- Unpin ---
  unpinChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  unpinMessageId: Workflow.string({
    label: 'Message ID',
    acceptsVariables: true,
  }),

  // --- Send Chat Action ---
  sendActionChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  sendActionAction: Workflow.select({
    label: 'Action',
    options: CHAT_ACTION_OPTIONS,
    default: 'typing',
  }),
  sendActionThreadId: Workflow.string({
    label: 'Forum Topic ID',
    acceptsVariables: true,
  }),

  // --- Send Photo ---
  sendPhotoChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  sendPhotoFile: Workflow.string({
    label: 'Photo',
    description: 'File ID or HTTP URL',
    acceptsVariables: true,
  }),
  sendPhotoCaption: Workflow.string({
    label: 'Caption',
    acceptsVariables: true,
  }),
  sendPhotoParseMode: Workflow.select({
    label: 'Parse Mode',
    options: PARSE_MODE_OPTIONS,
    default: 'HTML',
  }),
  sendPhotoDisableNotification: Workflow.boolean({
    label: 'Disable Notification',
    default: false,
  }),
  sendPhotoReplyToMessageId: Workflow.string({
    label: 'Reply To Message ID',
    acceptsVariables: true,
  }),
  sendPhotoThreadId: Workflow.string({
    label: 'Forum Topic ID',
    acceptsVariables: true,
  }),
  sendPhotoReplyMarkup: Workflow.string({
    label: 'Reply Markup (JSON)',
    acceptsVariables: true,
  }),

  // --- Send Document ---
  sendDocChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  sendDocFile: Workflow.string({
    label: 'Document',
    description: 'File ID or HTTP URL',
    acceptsVariables: true,
  }),
  sendDocCaption: Workflow.string({
    label: 'Caption',
    acceptsVariables: true,
  }),
  sendDocParseMode: Workflow.select({
    label: 'Parse Mode',
    options: PARSE_MODE_OPTIONS,
    default: 'HTML',
  }),
  sendDocDisableNotification: Workflow.boolean({
    label: 'Disable Notification',
    default: false,
  }),
  sendDocReplyToMessageId: Workflow.string({
    label: 'Reply To Message ID',
    acceptsVariables: true,
  }),
  sendDocThreadId: Workflow.string({
    label: 'Forum Topic ID',
    acceptsVariables: true,
  }),
  sendDocReplyMarkup: Workflow.string({
    label: 'Reply Markup (JSON)',
    acceptsVariables: true,
  }),

  // --- Send Video ---
  sendVideoChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  sendVideoFile: Workflow.string({
    label: 'Video',
    description: 'File ID or HTTP URL',
    acceptsVariables: true,
  }),
  sendVideoCaption: Workflow.string({
    label: 'Caption',
    acceptsVariables: true,
  }),
  sendVideoParseMode: Workflow.select({
    label: 'Parse Mode',
    options: PARSE_MODE_OPTIONS,
    default: 'HTML',
  }),
  sendVideoDuration: Workflow.number({
    label: 'Duration (seconds)',
  }),
  sendVideoWidth: Workflow.number({
    label: 'Width',
  }),
  sendVideoHeight: Workflow.number({
    label: 'Height',
  }),
  sendVideoDisableNotification: Workflow.boolean({
    label: 'Disable Notification',
    default: false,
  }),
  sendVideoReplyToMessageId: Workflow.string({
    label: 'Reply To Message ID',
    acceptsVariables: true,
  }),
  sendVideoThreadId: Workflow.string({
    label: 'Forum Topic ID',
    acceptsVariables: true,
  }),
  sendVideoReplyMarkup: Workflow.string({
    label: 'Reply Markup (JSON)',
    acceptsVariables: true,
  }),

  // --- Send Audio ---
  sendAudioChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  sendAudioFile: Workflow.string({
    label: 'Audio',
    description: 'File ID or HTTP URL',
    acceptsVariables: true,
  }),
  sendAudioCaption: Workflow.string({
    label: 'Caption',
    acceptsVariables: true,
  }),
  sendAudioParseMode: Workflow.select({
    label: 'Parse Mode',
    options: PARSE_MODE_OPTIONS,
    default: 'HTML',
  }),
  sendAudioDuration: Workflow.number({
    label: 'Duration (seconds)',
  }),
  sendAudioPerformer: Workflow.string({
    label: 'Performer',
    acceptsVariables: true,
  }),
  sendAudioTitle: Workflow.string({
    label: 'Title',
    acceptsVariables: true,
  }),
  sendAudioDisableNotification: Workflow.boolean({
    label: 'Disable Notification',
    default: false,
  }),
  sendAudioReplyToMessageId: Workflow.string({
    label: 'Reply To Message ID',
    acceptsVariables: true,
  }),
  sendAudioThreadId: Workflow.string({
    label: 'Forum Topic ID',
    acceptsVariables: true,
  }),
  sendAudioReplyMarkup: Workflow.string({
    label: 'Reply Markup (JSON)',
    acceptsVariables: true,
  }),

  // --- Send Animation ---
  sendAnimationChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  sendAnimationFile: Workflow.string({
    label: 'Animation',
    description: 'File ID or HTTP URL',
    acceptsVariables: true,
  }),
  sendAnimationCaption: Workflow.string({
    label: 'Caption',
    acceptsVariables: true,
  }),
  sendAnimationParseMode: Workflow.select({
    label: 'Parse Mode',
    options: PARSE_MODE_OPTIONS,
    default: 'HTML',
  }),
  sendAnimationDuration: Workflow.number({
    label: 'Duration (seconds)',
  }),
  sendAnimationWidth: Workflow.number({
    label: 'Width',
  }),
  sendAnimationHeight: Workflow.number({
    label: 'Height',
  }),
  sendAnimationDisableNotification: Workflow.boolean({
    label: 'Disable Notification',
    default: false,
  }),
  sendAnimationReplyToMessageId: Workflow.string({
    label: 'Reply To Message ID',
    acceptsVariables: true,
  }),
  sendAnimationThreadId: Workflow.string({
    label: 'Forum Topic ID',
    acceptsVariables: true,
  }),
  sendAnimationReplyMarkup: Workflow.string({
    label: 'Reply Markup (JSON)',
    acceptsVariables: true,
  }),

  // --- Send Sticker ---
  sendStickerChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  sendStickerFile: Workflow.string({
    label: 'Sticker',
    description: 'File ID or HTTP URL',
    acceptsVariables: true,
  }),
  sendStickerDisableNotification: Workflow.boolean({
    label: 'Disable Notification',
    default: false,
  }),
  sendStickerReplyToMessageId: Workflow.string({
    label: 'Reply To Message ID',
    acceptsVariables: true,
  }),
  sendStickerThreadId: Workflow.string({
    label: 'Forum Topic ID',
    acceptsVariables: true,
  }),
  sendStickerReplyMarkup: Workflow.string({
    label: 'Reply Markup (JSON)',
    acceptsVariables: true,
  }),

  // --- Send Location ---
  sendLocationChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  sendLocationLatitude: Workflow.string({
    label: 'Latitude',
    description: '-90 to 90',
    acceptsVariables: true,
  }),
  sendLocationLongitude: Workflow.string({
    label: 'Longitude',
    description: '-180 to 180',
    acceptsVariables: true,
  }),
  sendLocationDisableNotification: Workflow.boolean({
    label: 'Disable Notification',
    default: false,
  }),
  sendLocationReplyToMessageId: Workflow.string({
    label: 'Reply To Message ID',
    acceptsVariables: true,
  }),
  sendLocationThreadId: Workflow.string({
    label: 'Forum Topic ID',
    acceptsVariables: true,
  }),
  sendLocationReplyMarkup: Workflow.string({
    label: 'Reply Markup (JSON)',
    acceptsVariables: true,
  }),

  // --- Send Media Group ---
  sendMediaGroupChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  sendMediaGroupMedia: Workflow.string({
    label: 'Media',
    description: 'JSON array of media items (2-10 items)',
    acceptsVariables: true,
  }),
  sendMediaGroupDisableNotification: Workflow.boolean({
    label: 'Disable Notification',
    default: false,
  }),
  sendMediaGroupReplyToMessageId: Workflow.string({
    label: 'Reply To Message ID',
    acceptsVariables: true,
  }),
  sendMediaGroupThreadId: Workflow.string({
    label: 'Forum Topic ID',
    acceptsVariables: true,
  }),
}

export function messageComputeOutputs(operation: string) {
  switch (operation) {
    case 'sendMessage':
      return {
        messageId: Workflow.string({ label: 'Message ID' }),
        chatId: Workflow.string({ label: 'Chat ID' }),
        text: Workflow.string({ label: 'Text' }),
        date: Workflow.string({ label: 'Date' }),
      }
    case 'editMessageText':
      return {
        messageId: Workflow.string({ label: 'Message ID' }),
        chatId: Workflow.string({ label: 'Chat ID' }),
        text: Workflow.string({ label: 'Text' }),
        editDate: Workflow.string({ label: 'Edit Date' }),
      }
    case 'deleteMessage':
    case 'pinMessage':
    case 'unpinMessage':
    case 'sendChatAction':
      return {
        success: Workflow.string({ label: 'Success' }),
      }
    case 'sendPhoto':
      return {
        messageId: Workflow.string({ label: 'Message ID' }),
        chatId: Workflow.string({ label: 'Chat ID' }),
        photo: Workflow.string({ label: 'Photo' }),
        caption: Workflow.string({ label: 'Caption' }),
        date: Workflow.string({ label: 'Date' }),
      }
    case 'sendDocument':
      return {
        messageId: Workflow.string({ label: 'Message ID' }),
        chatId: Workflow.string({ label: 'Chat ID' }),
        document: Workflow.string({ label: 'Document' }),
        caption: Workflow.string({ label: 'Caption' }),
        date: Workflow.string({ label: 'Date' }),
      }
    case 'sendVideo':
      return {
        messageId: Workflow.string({ label: 'Message ID' }),
        chatId: Workflow.string({ label: 'Chat ID' }),
        video: Workflow.string({ label: 'Video' }),
        caption: Workflow.string({ label: 'Caption' }),
        date: Workflow.string({ label: 'Date' }),
      }
    case 'sendAudio':
      return {
        messageId: Workflow.string({ label: 'Message ID' }),
        chatId: Workflow.string({ label: 'Chat ID' }),
        audio: Workflow.string({ label: 'Audio' }),
        caption: Workflow.string({ label: 'Caption' }),
        date: Workflow.string({ label: 'Date' }),
      }
    case 'sendAnimation':
      return {
        messageId: Workflow.string({ label: 'Message ID' }),
        chatId: Workflow.string({ label: 'Chat ID' }),
        animation: Workflow.string({ label: 'Animation' }),
        caption: Workflow.string({ label: 'Caption' }),
        date: Workflow.string({ label: 'Date' }),
      }
    case 'sendSticker':
      return {
        messageId: Workflow.string({ label: 'Message ID' }),
        chatId: Workflow.string({ label: 'Chat ID' }),
        sticker: Workflow.string({ label: 'Sticker' }),
        date: Workflow.string({ label: 'Date' }),
      }
    case 'sendLocation':
      return {
        messageId: Workflow.string({ label: 'Message ID' }),
        chatId: Workflow.string({ label: 'Chat ID' }),
        location: Workflow.string({ label: 'Location' }),
        date: Workflow.string({ label: 'Date' }),
      }
    case 'sendMediaGroup':
      return {
        messages: Workflow.array({
          label: 'Messages',
          items: Workflow.struct({
            message_id: Workflow.string({ label: 'Message ID' }),
          }),
        }),
        count: Workflow.string({ label: 'Count' }),
      }
    default:
      return {}
  }
}

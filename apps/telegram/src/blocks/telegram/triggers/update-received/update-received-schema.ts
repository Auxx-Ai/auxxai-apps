// src/blocks/telegram/triggers/update-received/update-received-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

export const updateReceivedSchema = {
  inputs: {
    updateTypes: Workflow.select({
      label: 'Update Types',
      multi: true,
      options: [
        { value: 'message', label: 'Messages' },
        { value: 'edited_message', label: 'Edited Messages' },
        { value: 'callback_query', label: 'Callback Queries' },
        { value: 'channel_post', label: 'Channel Posts' },
        { value: 'edited_channel_post', label: 'Edited Channel Posts' },
      ],
      default: [
        'message',
        'edited_message',
        'callback_query',
        'channel_post',
        'edited_channel_post',
      ],
    }),
    allowedChatIds: Workflow.string({
      label: 'Allowed Chat IDs',
      description: 'Comma-separated list of chat IDs to accept (leave empty for all)',
      default: '',
    }),
    allowedUserIds: Workflow.string({
      label: 'Allowed User IDs',
      description: 'Comma-separated list of user IDs to accept (leave empty for all)',
      default: '',
    }),
  },
  outputs: {
    updateId: Workflow.number({ label: 'Update ID', description: 'Telegram update ID' }),
    updateType: Workflow.string({
      label: 'Update Type',
      description: 'message, edited_message, callback_query, channel_post, etc.',
    }),
    messageId: Workflow.number({ label: 'Message ID', description: 'Message ID (0 if N/A)' }),
    chatId: Workflow.number({ label: 'Chat ID' }),
    chatType: Workflow.string({
      label: 'Chat Type',
      description: 'private, group, supergroup, or channel',
    }),
    chatTitle: Workflow.string({
      label: 'Chat Title',
      description: 'Chat title (groups/channels)',
    }),
    fromUserId: Workflow.number({ label: 'From User ID' }),
    fromUsername: Workflow.string({ label: 'From Username' }),
    fromFirstName: Workflow.string({ label: 'From First Name' }),
    fromLastName: Workflow.string({ label: 'From Last Name' }),
    text: Workflow.string({
      label: 'Text',
      description: 'Message text, caption, or callback data',
    }),
    messageType: Workflow.string({
      label: 'Message Type',
      description: 'text, photo, document, video, audio, sticker, location, callback_query, other',
    }),
    callbackQueryId: Workflow.string({
      label: 'Callback Query ID',
      description: 'Callback query ID (empty if not a callback)',
    }),
    callbackData: Workflow.string({
      label: 'Callback Data',
      description: 'Callback data (empty if not a callback)',
    }),
    date: Workflow.number({ label: 'Date (Unix)', description: 'Unix timestamp' }),
    replyToMessageId: Workflow.number({
      label: 'Reply To Message ID',
      description: 'Replied-to message ID (0 if N/A)',
    }),
    raw: Workflow.string({ label: 'Raw Update', description: 'Full raw Telegram update object' }),
  },
} satisfies WorkflowSchema

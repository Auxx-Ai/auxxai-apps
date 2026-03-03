// src/blocks/discord/resources/message/message-schema.ts

import { Workflow } from '@auxx/sdk'

export const messageInputs = {
  // --- Message: Send ---
  sendGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  sendChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a text channel',
    options: [] as { value: string; label: string }[],
  }),
  sendContent: Workflow.string({
    label: 'Message Content',
    description: 'Message text (0-2000 chars)',
    placeholder: 'Hello from Auxx!',
    acceptsVariables: true,
  }),
  sendTts: Workflow.boolean({
    label: 'Text-to-Speech (TTS)',
    default: false,
  }),
  sendReplyTo: Workflow.string({
    label: 'Reply to Message ID',
    description: 'Message ID to reply to (optional)',
    placeholder: '1234567890123456789',
    acceptsVariables: true,
  }),
  sendSuppressEmbeds: Workflow.boolean({
    label: 'Suppress Embeds',
    description: 'Suppress link preview embeds',
    default: false,
  }),
  sendSuppressNotifications: Workflow.boolean({
    label: 'Suppress Notifications',
    description: 'Suppress push/desktop notifications',
    default: false,
  }),

  // --- Message: Get ---
  getMessageGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  getMessageChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel',
    options: [] as { value: string; label: string }[],
  }),
  getMessageId: Workflow.string({
    label: 'Message ID',
    placeholder: '1234567890123456789',
    acceptsVariables: true,
  }),

  // --- Message: Get Many ---
  getManyMessageGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  getManyMessageChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel',
    options: [] as { value: string; label: string }[],
  }),
  getManyMessageReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Fetch all messages (up to hard cap)',
    default: false,
  }),
  getManyMessageLimit: Workflow.number({
    label: 'Limit',
    description: 'Max messages to return (1-100)',
    default: 50,
  }),

  // --- Message: Delete ---
  deleteMessageGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  deleteMessageChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel',
    options: [] as { value: string; label: string }[],
  }),
  deleteMessageId: Workflow.string({
    label: 'Message ID',
    description: 'Message ID to delete',
    placeholder: '1234567890123456789',
    acceptsVariables: true,
  }),

  // --- Message: React ---
  reactGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  reactChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel',
    options: [] as { value: string; label: string }[],
  }),
  reactMessageId: Workflow.string({
    label: 'Message ID',
    description: 'Message ID to react to',
    placeholder: '1234567890123456789',
    acceptsVariables: true,
  }),
  reactEmoji: Workflow.string({
    label: 'Emoji',
    description: 'Emoji to react with (e.g. 👍 or custom_emoji:123)',
    placeholder: '👍',
    acceptsVariables: true,
  }),
}

export function messageComputeOutputs(operation: string) {
  if (operation === 'send') {
    return {
      messageId: Workflow.string({ label: 'Message ID' }),
      channelId: Workflow.string({ label: 'Channel ID' }),
      content: Workflow.string({ label: 'Content' }),
      timestamp: Workflow.string({ label: 'Timestamp' }),
    }
  }
  if (operation === 'get') {
    return {
      messageId: Workflow.string({ label: 'Message ID' }),
      content: Workflow.string({ label: 'Content' }),
      authorId: Workflow.string({ label: 'Author ID' }),
      authorUsername: Workflow.string({ label: 'Author Username' }),
      timestamp: Workflow.string({ label: 'Timestamp' }),
      messageData: Workflow.string({ label: 'Message Data (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      messages: Workflow.array({
        label: 'Messages',
        items: Workflow.struct({
          id: Workflow.string({ label: 'ID' }),
          content: Workflow.string({ label: 'Content' }),
          author: Workflow.string({ label: 'Author' }),
        }),
      }),
      totalCount: Workflow.string({ label: 'Total Count' }),
      truncated: Workflow.string({ label: 'Truncated' }),
    }
  }
  if (operation === 'delete') {
    return {
      deletedMessageId: Workflow.string({ label: 'Deleted Message ID' }),
      deleted: Workflow.string({ label: 'Deleted' }),
    }
  }
  if (operation === 'react') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  return {}
}

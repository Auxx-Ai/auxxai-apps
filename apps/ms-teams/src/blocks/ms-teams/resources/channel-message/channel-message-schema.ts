// src/blocks/ms-teams/resources/channel-message/channel-message-schema.ts

import { Workflow } from '@auxx/sdk'

export const channelMessageInputs = {
  // --- Channel Message: Create ---
  msgCreateTeam: Workflow.select({
    label: 'Team',
    description: 'Select a Microsoft Teams team',
    options: [] as { value: string; label: string }[],
  }),
  msgCreateChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel',
    options: [] as { value: string; label: string }[],
  }),
  msgCreateContentType: Workflow.select({
    label: 'Content Type',
    options: [
      { value: 'text', label: 'Text' },
      { value: 'html', label: 'HTML' },
    ],
    default: 'text',
  }),
  msgCreateMessage: Workflow.string({
    label: 'Message',
    description: 'Message content',
    placeholder: 'Type your message...',
    acceptsVariables: true,
  }),
  msgCreateReplyToId: Workflow.string({
    label: 'Reply To Message ID',
    description: 'Message ID to reply to (optional)',
    placeholder: 'Leave empty for a new message',
    acceptsVariables: true,
  }),

  // --- Channel Message: Get Many ---
  msgGetManyTeam: Workflow.select({
    label: 'Team',
    description: 'Select a Microsoft Teams team',
    options: [] as { value: string; label: string }[],
  }),
  msgGetManyChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel',
    options: [] as { value: string; label: string }[],
  }),
  msgGetManyReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all messages instead of a limited number',
    default: false,
  }),
  msgGetManyLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of messages to return',
    default: 50,
  }),
}

export function channelMessageComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      messageId: Workflow.string({ label: 'Message ID' }),
      createdDateTime: Workflow.string({ label: 'Created Date' }),
      webUrl: Workflow.string({ label: 'Web URL' }),
    }
  }
  if (operation === 'getMany') {
    return {
      messages: Workflow.array({
        label: 'Messages',
        items: Workflow.struct({
          id: Workflow.string({ label: 'ID' }),
          createdDateTime: Workflow.string({ label: 'Created Date' }),
        }),
      }),
      totalCount: Workflow.string({ label: 'Total Count' }),
    }
  }
  return {}
}

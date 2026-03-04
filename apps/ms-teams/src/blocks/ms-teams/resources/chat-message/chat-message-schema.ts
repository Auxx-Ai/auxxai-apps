// src/blocks/ms-teams/resources/chat-message/chat-message-schema.ts

import { Workflow } from '@auxx/sdk'

export const chatMessageInputs = {
  // --- Chat Message: Create ---
  chatCreateChat: Workflow.select({
    label: 'Chat',
    description: 'Select a chat',
    options: [] as { value: string; label: string }[],
  }),
  chatCreateContentType: Workflow.select({
    label: 'Content Type',
    options: [
      { value: 'text', label: 'Text' },
      { value: 'html', label: 'HTML' },
    ],
    default: 'text',
  }),
  chatCreateMessage: Workflow.string({
    label: 'Message',
    description: 'Message content',
    placeholder: 'Type your message...',
    acceptsVariables: true,
  }),

  // --- Chat Message: Get ---
  chatGetChat: Workflow.select({
    label: 'Chat',
    description: 'Select a chat',
    options: [] as { value: string; label: string }[],
  }),
  chatGetMessageId: Workflow.string({
    label: 'Message ID',
    description: 'ID of the message to retrieve',
    placeholder: 'Enter message ID',
    acceptsVariables: true,
  }),

  // --- Chat Message: Get Many ---
  chatGetManyChat: Workflow.select({
    label: 'Chat',
    description: 'Select a chat',
    options: [] as { value: string; label: string }[],
  }),
  chatGetManyReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all messages instead of a limited number',
    default: false,
  }),
  chatGetManyLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of messages to return',
    default: 50,
  }),
}

export function chatMessageComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      messageId: Workflow.string({ label: 'Message ID' }),
      createdDateTime: Workflow.string({ label: 'Created Date' }),
    }
  }
  if (operation === 'get') {
    return {
      messageId: Workflow.string({ label: 'Message ID' }),
      createdDateTime: Workflow.string({ label: 'Created Date' }),
      content: Workflow.string({ label: 'Content' }),
      contentType: Workflow.string({ label: 'Content Type' }),
      from: Workflow.string({ label: 'From (JSON)' }),
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

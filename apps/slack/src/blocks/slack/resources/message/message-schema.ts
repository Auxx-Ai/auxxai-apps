// src/blocks/slack/resources/message/message-schema.ts

/**
 * Message resource input/output field definitions.
 * Operations: Send, Delete
 */

import { Workflow } from '@auxx/sdk'

export const messageInputs = {
  // --- Message: Send --- (existing send-message fields)
  sendTo: Workflow.select({
    label: 'Send To',
    description: 'Choose whether to send to a channel or a user',
    options: [
      { value: 'channel', label: 'Channel' },
      { value: 'user', label: 'User' },
    ],
    default: 'channel',
  }),

  channelMode: Workflow.select({
    label: 'Channel',
    description: 'How to specify the channel',
    options: [
      { value: 'list', label: 'From List' },
      { value: 'id', label: 'By ID' },
      { value: 'name', label: 'By Name' },
      { value: 'url', label: 'By URL' },
    ],
    default: 'list',
  }),
  channelList: Workflow.select({
    label: 'Channel',
    description: 'Select a channel from your Slack workspace',
    options: [] as { value: string; label: string }[],
  }),
  channel: Workflow.string({
    label: 'Channel ID',
    description: 'Slack channel ID',
    placeholder: 'C0122KQ70S7E',
    acceptsVariables: true,
  }),
  channelName: Workflow.string({
    label: 'Channel Name',
    description: 'Channel name (with or without #)',
    placeholder: '#general',
    acceptsVariables: true,
  }),
  channelUrl: Workflow.string({
    label: 'Channel URL',
    description: 'Slack channel URL',
    placeholder: 'https://app.slack.com/client/T.../C...',
    acceptsVariables: true,
  }),

  userMode: Workflow.select({
    label: 'User',
    description: 'How to specify the user',
    options: [
      { value: 'list', label: 'From List' },
      { value: 'id', label: 'By ID' },
      { value: 'email', label: 'By Email' },
    ],
    default: 'list',
  }),
  userList: Workflow.select({
    label: 'User',
    description: 'Select a user from your Slack workspace',
    options: [] as { value: string; label: string }[],
  }),
  user: Workflow.string({
    label: 'User ID',
    description: 'Slack user ID',
    placeholder: 'U0122KQ70S7E',
    acceptsVariables: true,
  }),
  userEmail: Workflow.string({
    label: 'Email',
    description: 'User email address',
    placeholder: 'user@company.com',
    acceptsVariables: true,
  }),

  text: Workflow.string({
    label: 'Message',
    description: 'Message text to send',
    placeholder: 'Enter your message...',
    acceptsVariables: true,
    minLength: 1,
  }),
  threadTs: Workflow.string({
    label: 'Thread Timestamp',
    description: 'Reply to a specific thread (message timestamp)',
    placeholder: '1234567890.123456',
    acceptsVariables: true,
  }),
  unfurlLinks: Workflow.boolean({
    label: 'Unfurl Links',
    description: 'Show previews for URLs in the message',
    default: true,
  }),
  unfurlMedia: Workflow.boolean({
    label: 'Unfurl Media',
    description: 'Show previews for media URLs in the message',
    default: true,
  }),

  // --- Message: Delete ---
  deleteChannelMode: Workflow.select({
    label: 'Channel',
    description: 'How to specify the channel',
    options: [
      { value: 'list', label: 'From List' },
      { value: 'id', label: 'By ID' },
    ],
    default: 'list',
  }),
  deleteChannelList: Workflow.select({
    label: 'Channel',
    description: 'Select the channel containing the message',
    options: [] as { value: string; label: string }[],
  }),
  deleteChannelId: Workflow.string({
    label: 'Channel ID',
    placeholder: 'C0122KQ70S7E',
    acceptsVariables: true,
  }),
  deleteMessageTs: Workflow.string({
    label: 'Message Timestamp',
    description: 'The ts value of the message to delete',
    placeholder: '1234567890.123456',
    acceptsVariables: true,
  }),
}

export function messageComputeOutputs(operation: string) {
  if (operation === 'send') {
    return {
      messageTs: Workflow.string({
        label: 'Message Timestamp',
        description: 'Slack message timestamp (unique message identifier)',
      }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  return {}
}

/**
 * Additional dynamic outputs for Message:Send based on sendTo value.
 * Called by the top-level computeOutputs when resource=message, operation=send.
 */
export function messageSendDynamicOutputs(sendTo: string) {
  if (sendTo === 'channel') {
    return {
      channelId: Workflow.string({ label: 'Channel ID' }),
      channelName: Workflow.string({ label: 'Channel Name' }),
    }
  }
  if (sendTo === 'user') {
    return {
      userId: Workflow.string({ label: 'User ID' }),
      dmChannelId: Workflow.string({ label: 'DM Channel ID' }),
    }
  }
  return {}
}

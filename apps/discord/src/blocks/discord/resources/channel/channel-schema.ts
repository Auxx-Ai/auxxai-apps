// src/blocks/discord/resources/channel/channel-schema.ts

import { Workflow } from '@auxx/sdk'

export const channelInputs = {
  // --- Channel: Create ---
  createGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  createName: Workflow.string({
    label: 'Channel Name',
    description: 'Name for the new channel',
    placeholder: 'new-channel',
    acceptsVariables: true,
  }),
  createType: Workflow.select({
    label: 'Type',
    options: [
      { value: 'text', label: 'Text' },
      { value: 'voice', label: 'Voice' },
      { value: 'category', label: 'Category' },
    ],
    default: 'text',
  }),
  createTopic: Workflow.string({
    label: 'Topic',
    description: 'Channel description (0-1024 chars)',
    placeholder: 'Channel topic...',
    acceptsVariables: true,
  }),
  createCategory: Workflow.select({
    label: 'Category',
    description: 'Parent category (optional)',
    options: [] as { value: string; label: string }[],
  }),
  createNsfw: Workflow.boolean({
    label: 'NSFW',
    description: 'Mark as age-restricted',
    default: false,
  }),

  // --- Channel: Get ---
  getGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  getChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel',
    options: [] as { value: string; label: string }[],
  }),

  // --- Channel: Get Many ---
  getManyGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  getManyFilterType: Workflow.select({
    label: 'Filter by Type',
    options: [
      { value: 'all', label: 'All' },
      { value: 'text', label: 'Text' },
      { value: 'voice', label: 'Voice' },
      { value: 'category', label: 'Category' },
    ],
    default: 'all',
  }),

  // --- Channel: Update ---
  updateGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  updateChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel to update',
    options: [] as { value: string; label: string }[],
  }),
  updateName: Workflow.string({
    label: 'Name',
    description: 'New channel name (optional)',
    placeholder: 'updated-channel-name',
    acceptsVariables: true,
  }),
  updateTopic: Workflow.string({
    label: 'Topic',
    description: 'New topic/description (optional)',
    placeholder: 'Updated topic...',
    acceptsVariables: true,
  }),
  updateCategory: Workflow.select({
    label: 'Category',
    description: 'Move to category (optional)',
    options: [] as { value: string; label: string }[],
  }),
  updateNsfw: Workflow.boolean({
    label: 'NSFW',
    description: 'Toggle age-restricted',
    default: false,
  }),

  // --- Channel: Delete ---
  deleteGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  deleteChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel to delete',
    options: [] as { value: string; label: string }[],
  }),
}

export function channelComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      channelId: Workflow.string({ label: 'Channel ID' }),
      channelName: Workflow.string({ label: 'Channel Name' }),
      channelType: Workflow.string({ label: 'Channel Type' }),
    }
  }
  if (operation === 'get') {
    return {
      channelId: Workflow.string({ label: 'Channel ID' }),
      channelName: Workflow.string({ label: 'Channel Name' }),
      channelType: Workflow.string({ label: 'Channel Type' }),
      channelTopic: Workflow.string({ label: 'Topic' }),
      channelData: Workflow.string({ label: 'Channel Data (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      channels: Workflow.array({
        label: 'Channels',
        items: Workflow.struct({
          id: Workflow.string({ label: 'ID' }),
          name: Workflow.string({ label: 'Name' }),
          type: Workflow.string({ label: 'Type' }),
        }),
      }),
      totalCount: Workflow.string({ label: 'Total Count' }),
    }
  }
  if (operation === 'update') {
    return {
      channelId: Workflow.string({ label: 'Channel ID' }),
      channelName: Workflow.string({ label: 'Channel Name' }),
      channelData: Workflow.string({ label: 'Channel Data (JSON)' }),
    }
  }
  if (operation === 'delete') {
    return {
      deletedChannelId: Workflow.string({ label: 'Deleted Channel ID' }),
      deletedChannelName: Workflow.string({ label: 'Deleted Channel Name' }),
    }
  }
  return {}
}

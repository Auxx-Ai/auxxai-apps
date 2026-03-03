// src/blocks/ms-teams/resources/channel/channel-schema.ts

import { Workflow } from '@auxx/sdk'

export const channelInputs = {
  // --- Channel: Create ---
  channelCreateTeam: Workflow.select({
    label: 'Team',
    description: 'Select a Microsoft Teams team',
    options: [] as { value: string; label: string }[],
  }),
  channelCreateName: Workflow.string({
    label: 'Channel Name',
    description: 'Display name for the new channel',
    placeholder: 'General Discussion',
    acceptsVariables: true,
  }),
  channelCreateType: Workflow.select({
    label: 'Type',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'private', label: 'Private' },
    ],
    default: 'standard',
  }),
  channelCreateDescription: Workflow.string({
    label: 'Description',
    description: 'Channel description (optional)',
    placeholder: 'What this channel is about...',
    acceptsVariables: true,
  }),

  // --- Channel: Get ---
  channelGetTeam: Workflow.select({
    label: 'Team',
    description: 'Select a Microsoft Teams team',
    options: [] as { value: string; label: string }[],
  }),
  channelGetChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel',
    options: [] as { value: string; label: string }[],
  }),

  // --- Channel: Get Many ---
  channelGetManyTeam: Workflow.select({
    label: 'Team',
    description: 'Select a Microsoft Teams team',
    options: [] as { value: string; label: string }[],
  }),
  channelGetManyReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all channels instead of a limited number',
    default: false,
  }),
  channelGetManyLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of channels to return',
    default: 50,
  }),

  // --- Channel: Update ---
  channelUpdateTeam: Workflow.select({
    label: 'Team',
    description: 'Select a Microsoft Teams team',
    options: [] as { value: string; label: string }[],
  }),
  channelUpdateChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel to update',
    options: [] as { value: string; label: string }[],
  }),
  channelUpdateName: Workflow.string({
    label: 'Name',
    description: 'New display name (optional)',
    placeholder: 'Updated channel name',
    acceptsVariables: true,
  }),
  channelUpdateDescription: Workflow.string({
    label: 'Description',
    description: 'New description (optional)',
    placeholder: 'Updated description...',
    acceptsVariables: true,
  }),

  // --- Channel: Delete ---
  channelDeleteTeam: Workflow.select({
    label: 'Team',
    description: 'Select a Microsoft Teams team',
    options: [] as { value: string; label: string }[],
  }),
  channelDeleteChannel: Workflow.select({
    label: 'Channel',
    description: 'Select a channel to delete',
    options: [] as { value: string; label: string }[],
  }),
}

export function channelComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      channelId: Workflow.string({ label: 'Channel ID' }),
      displayName: Workflow.string({ label: 'Display Name' }),
      description: Workflow.string({ label: 'Description' }),
    }
  }
  if (operation === 'get') {
    return {
      channelId: Workflow.string({ label: 'Channel ID' }),
      displayName: Workflow.string({ label: 'Display Name' }),
      description: Workflow.string({ label: 'Description' }),
      membershipType: Workflow.string({ label: 'Membership Type' }),
      webUrl: Workflow.string({ label: 'Web URL' }),
    }
  }
  if (operation === 'getMany') {
    return {
      channels: Workflow.array({
        label: 'Channels',
        items: Workflow.struct({
          id: Workflow.string({ label: 'ID' }),
          displayName: Workflow.string({ label: 'Display Name' }),
        }),
      }),
      totalCount: Workflow.string({ label: 'Total Count' }),
    }
  }
  if (operation === 'update') {
    return {
      channelId: Workflow.string({ label: 'Channel ID' }),
      displayName: Workflow.string({ label: 'Display Name' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  return {}
}

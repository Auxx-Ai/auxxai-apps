// src/blocks/slack/resources/channel/channel-schema.ts

/**
 * Channel resource input/output field definitions.
 * Operations: Create, Get
 */

import { Workflow } from '@auxx/sdk'

export const channelInputs = {
  // --- Channel: Create ---
  createChannelName: Workflow.string({
    label: 'Channel Name',
    description: 'Name for the new channel (lowercase, no spaces)',
    placeholder: 'project-updates',
    acceptsVariables: true,
  }),
  createChannelVisibility: Workflow.select({
    label: 'Visibility',
    options: [
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' },
    ],
    default: 'public',
  }),

  // --- Channel: Get ---
  getChannelMode: Workflow.select({
    label: 'Channel',
    description: 'How to specify the channel',
    options: [
      { value: 'list', label: 'From List' },
      { value: 'id', label: 'By ID' },
      { value: 'name', label: 'By Name' },
    ],
    default: 'list',
  }),
  getChannelList: Workflow.select({
    label: 'Channel',
    description: 'Select a channel',
    options: [] as { value: string; label: string }[],
  }),
  getChannelId: Workflow.string({
    label: 'Channel ID',
    placeholder: 'C0122KQ70S7E',
    acceptsVariables: true,
  }),
  getChannelName: Workflow.string({
    label: 'Channel Name',
    placeholder: '#general',
    acceptsVariables: true,
  }),
}

export function channelComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      channelId: Workflow.string({ label: 'Channel ID' }),
      channelName: Workflow.string({ label: 'Channel Name' }),
    }
  }
  if (operation === 'get') {
    return {
      channelId: Workflow.string({ label: 'Channel ID' }),
      channelName: Workflow.string({ label: 'Channel Name' }),
      channelTopic: Workflow.string({ label: 'Topic' }),
      channelPurpose: Workflow.string({ label: 'Purpose' }),
      memberCount: Workflow.string({ label: 'Member Count' }),
      isPrivate: Workflow.string({ label: 'Is Private' }),
    }
  }
  return {}
}

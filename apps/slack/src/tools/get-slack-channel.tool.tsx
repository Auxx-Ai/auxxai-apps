// src/tools/get-slack-channel.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import getSlackChannelExecute from './get-slack-channel.tool.server'

export const getSlackChannelTool = defineTool({
  id: 'get_slack_channel',
  name: 'Get Slack channel',
  description: 'Fetch full details for a Slack channel by id (conversations.info).',
  icon: slackIcon,
  inputs: z.object({ channelId: z.string() }),
  outputs: z.object({
    id: z.string(),
    name: z.string(),
    isPrivate: z.boolean(),
    isArchived: z.boolean(),
    memberCount: z.number().nullable(),
    topic: z.string().nullable(),
    purpose: z.string().nullable(),
    createdAt: z.string().nullable().describe('ISO 8601 timestamp from `created` epoch.'),
  }),
  exampleOutput: {
    id: 'C0123ABCDEF',
    name: 'general',
    isPrivate: false,
    isArchived: false,
    memberCount: 42,
    topic: 'Company-wide announcements and general chatter',
    purpose: 'This channel is for workspace-wide communication and announcements.',
    createdAt: '2026-01-15T09:00:00Z',
  },
  config: { requiresConnection: true, timeout: 10000 },
  execute: getSlackChannelExecute,
  agent: { toolsetSlug: 'slack.channels.read' },
})

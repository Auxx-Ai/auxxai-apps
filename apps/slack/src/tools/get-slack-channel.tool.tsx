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
  config: { requiresConnection: true, timeout: 10000 },
  execute: getSlackChannelExecute,
  agent: { toolsetSlug: 'slack.channels.read' },
})

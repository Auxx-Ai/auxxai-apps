// src/tools/find-slack-channel.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import findSlackChannelExecute from './find-slack-channel.tool.server'

export const findSlackChannelTool = defineTool({
  id: 'find_slack_channel',
  name: 'Find Slack channel',
  description:
    'Find a Slack channel by name (with or without #) or by Slack channel URL. Returns null if no match.',
  icon: slackIcon,
  inputs: z.object({
    query: z.string().describe('Channel name (with or without #) or a Slack channel URL.'),
  }),
  outputs: z.object({
    channel: z
      .object({
        id: z.string(),
        name: z.string(),
        isPrivate: z.boolean(),
        memberCount: z.number().nullable(),
        topic: z.string().nullable(),
        purpose: z.string().nullable(),
      })
      .nullable(),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: findSlackChannelExecute,
  agent: { toolsetSlug: 'slack.channels.read' },
})

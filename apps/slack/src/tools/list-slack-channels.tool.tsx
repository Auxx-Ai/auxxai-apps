// src/tools/list-slack-channels.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import listSlackChannelsExecute from './list-slack-channels.tool.server'

export const listSlackChannelsTool = defineTool({
  id: 'list_slack_channels',
  name: 'List Slack channels',
  description:
    'List channels in the connected Slack workspace. Use this to discover channel IDs before calling any other Slack tool.',
  icon: slackIcon,
  inputs: z.object({}),
  outputs: z.object({
    channels: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        isPrivate: z.boolean(),
        memberCount: z.number().nullable(),
        isArchived: z.boolean(),
      })
    ),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: listSlackChannelsExecute,
})

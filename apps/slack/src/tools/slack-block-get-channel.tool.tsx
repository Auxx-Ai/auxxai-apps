// src/tools/slack-block-get-channel.tool.tsx

/**
 * Internal-only tool — backs the Slack block's `channel.get` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import slackBlockGetChannelExecute from './slack-block-get-channel.tool.server'

export const slackBlockGetChannelTool = defineTool({
  id: 'slack_block_get_channel',
  name: 'Slack: get channel (block)',
  description: 'Internal — backs the Slack block channel.get operation.',
  icon: slackIcon,
  inputs: z.object({
    getChannelMode: z.enum(['list', 'id', 'name']).optional(),
    getChannelList: z.string().optional(),
    getChannelId: z.string().optional(),
    getChannelName: z.string().optional(),
  }),
  outputs: z.object({
    channelId: z.string(),
    channelName: z.string(),
    channelTopic: z.string(),
    channelPurpose: z.string(),
    memberCount: z.string(),
    isPrivate: z.string(),
  }),
  config: { requiresConnection: true, timeout: 15000 },
  execute: slackBlockGetChannelExecute,
})

// src/tools/slack-block-get-channel.tool.tsx

/**
 * Internal-only tool — backs the Slack block's `channel.get` op.
 */

import { defineTool } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import { getChannelInputs, getChannelOutputs } from './schemas'
import slackBlockGetChannelExecute from './slack-block-get-channel.tool.server'

export const slackBlockGetChannelTool = defineTool({
  id: 'slack_block_get_channel',
  name: 'Slack: get channel (block)',
  description: 'Internal — backs the Slack block channel.get operation.',
  icon: slackIcon,
  inputs: getChannelInputs,
  outputs: getChannelOutputs,
  config: { requiresConnection: true, timeout: 15000 },
  execute: slackBlockGetChannelExecute,
})

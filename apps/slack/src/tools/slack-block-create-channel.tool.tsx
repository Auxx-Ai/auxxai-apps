// src/tools/slack-block-create-channel.tool.tsx

/**
 * Internal-only tool — backs the Slack block's `channel.create` op.
 * No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import { createChannelInputs, createChannelOutputs } from './schemas'
import slackBlockCreateChannelExecute from './slack-block-create-channel.tool.server'

export const slackBlockCreateChannelTool = defineTool({
  id: 'slack_block_create_channel',
  name: 'Slack: create channel (block)',
  description: 'Internal — backs the Slack block channel.create operation.',
  icon: slackIcon,
  inputs: createChannelInputs,
  outputs: createChannelOutputs,
  config: { requiresConnection: true, timeout: 15000 },
  execute: slackBlockCreateChannelExecute,
})

// src/tools/slack-block-send-message.tool.tsx

/**
 * Internal-only tool — backs the Slack block's `message.send` op.
 * Block-shaped input (channel/user mode flags) preserved as-is so the
 * dispatcher passes inputs through without transformation.
 */

import { defineTool } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import { sendMessageInputs, sendMessageOutputs } from './schemas'
import slackBlockSendMessageExecute from './slack-block-send-message.tool.server'

export const slackBlockSendMessageTool = defineTool({
  id: 'slack_block_send_message',
  name: 'Slack: send message (block)',
  description: 'Internal — backs the Slack block message.send operation.',
  icon: slackIcon,
  inputs: sendMessageInputs,
  outputs: sendMessageOutputs,
  config: { requiresConnection: true, timeout: 15000 },
  execute: slackBlockSendMessageExecute,
})

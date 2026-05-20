// src/tools/slack-block-delete-message.tool.tsx

/**
 * Internal-only tool — backs the Slack block's `message.delete` op.
 */

import { defineTool } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import { deleteMessageInputs, deleteMessageOutputs } from './schemas'
import slackBlockDeleteMessageExecute from './slack-block-delete-message.tool.server'

export const slackBlockDeleteMessageTool = defineTool({
  id: 'slack_block_delete_message',
  name: 'Slack: delete message (block)',
  description: 'Internal — backs the Slack block message.delete operation.',
  icon: slackIcon,
  inputs: deleteMessageInputs,
  outputs: deleteMessageOutputs,
  config: { requiresConnection: true, timeout: 15000 },
  execute: slackBlockDeleteMessageExecute,
})

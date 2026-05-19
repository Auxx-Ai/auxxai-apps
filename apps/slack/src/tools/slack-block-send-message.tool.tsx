// src/tools/slack-block-send-message.tool.tsx

/**
 * Internal-only tool — backs the Slack block's `message.send` op.
 * Block-shaped input (channel/user mode flags) preserved as-is so the
 * dispatcher passes inputs through without transformation.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import slackBlockSendMessageExecute from './slack-block-send-message.tool.server'

export const slackBlockSendMessageTool = defineTool({
  id: 'slack_block_send_message',
  name: 'Slack: send message (block)',
  description: 'Internal — backs the Slack block message.send operation.',
  icon: slackIcon,
  inputs: z.object({
    sendTo: z.enum(['channel', 'user']).optional(),
    // Channel target inputs
    channelMode: z.enum(['list', 'id', 'name', 'url']).optional(),
    channelList: z.string().optional(),
    channel: z.string().optional(),
    channelName: z.string().optional(),
    channelUrl: z.string().optional(),
    // User target inputs
    userMode: z.enum(['list', 'id', 'email']).optional(),
    userList: z.string().optional(),
    user: z.string().optional(),
    userEmail: z.string().optional(),
    // Message body
    text: z.string(),
    threadTs: z.string().optional(),
    unfurlLinks: z.boolean().optional(),
    unfurlMedia: z.boolean().optional(),
  }),
  outputs: z
    .object({
      messageTs: z.string(),
      channelId: z.string().optional(),
      channelName: z.string().optional(),
      userId: z.string().optional(),
      dmChannelId: z.string().optional(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: slackBlockSendMessageExecute,
})

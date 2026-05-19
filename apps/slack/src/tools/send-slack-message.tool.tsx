// src/tools/send-slack-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import sendSlackMessageExecute from './send-slack-message.tool.server'

export const sendSlackMessageTool = defineTool({
  id: 'send_slack_message',
  name: 'Send Slack message',
  description:
    'Post a message to a Slack channel or DM a Slack user. For channels, optionally reply to a thread via `threadTs`.',
  icon: slackIcon,
  inputs: z
    .object({
      to: z
        .object({
          kind: z.enum(['channel', 'user']),
          id: z.string(),
        })
        .describe(
          'Channel ID (e.g. C012...) or Slack user ID (e.g. U012...). For user, the tool opens a DM.'
        ),
      text: z.string().min(1),
      threadTs: z
        .string()
        .optional()
        .describe('Reply to a thread instead of posting a top-level message. Channels only.'),
    })
    .refine((v) => v.to.kind === 'channel' || !v.threadTs, {
      message: 'threadTs is only valid when to.kind === "channel".',
    }),
  outputs: z.object({
    channelId: z.string(),
    ts: z.string(),
    permalink: z.string().nullable(),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: sendSlackMessageExecute,
  agent: { toolsetSlug: 'slack.messages.write' },
})

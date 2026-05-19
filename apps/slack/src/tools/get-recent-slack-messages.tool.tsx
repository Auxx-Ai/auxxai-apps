// src/tools/get-recent-slack-messages.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import getRecentSlackMessagesExecute from './get-recent-slack-messages.tool.server'

export const getRecentSlackMessagesTool = defineTool({
  id: 'get_recent_slack_messages',
  name: 'Get recent Slack messages',
  description:
    'Read recent messages from a Slack channel (conversations.history). `threadTs` and `replyCount` tell you whether to follow up with `get_slack_message_thread`.',
  icon: slackIcon,
  inputs: z.object({
    channelId: z.string(),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  outputs: z.object({
    messages: z.array(
      z.object({
        ts: z.string(),
        userId: z.string().nullable(),
        text: z.string(),
        threadTs: z.string().nullable(),
        replyCount: z.number(),
      })
    ),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: getRecentSlackMessagesExecute,
})

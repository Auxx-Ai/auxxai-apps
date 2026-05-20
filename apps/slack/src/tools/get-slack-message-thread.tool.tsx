// src/tools/get-slack-message-thread.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import getSlackMessageThreadExecute from './get-slack-message-thread.tool.server'

const threadMessage = z.object({
  ts: z.string(),
  userId: z.string().nullable(),
  text: z.string(),
})

export const getSlackMessageThreadTool = defineTool({
  id: 'get_slack_message_thread',
  name: 'Get Slack message thread',
  description:
    'Fetch the parent message and all replies for a Slack thread. Use this when you need full context around a message, not just the message itself.',
  icon: slackIcon,
  inputs: z.object({
    channelId: z.string(),
    threadTs: z.string().describe('The thread parent `ts` (or any message ts in the thread).'),
  }),
  outputs: z.object({
    parent: threadMessage,
    replies: z.array(threadMessage),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: getSlackMessageThreadExecute,
  agent: { toolsetSlug: 'slack.messages.read' },
})

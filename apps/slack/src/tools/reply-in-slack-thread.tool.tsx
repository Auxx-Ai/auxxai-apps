// src/tools/reply-in-slack-thread.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import replyInSlackThreadExecute from './reply-in-slack-thread.tool.server'

export const replyInSlackThreadTool = defineTool({
  id: 'reply_in_slack_thread',
  name: 'Reply in Slack thread',
  description: 'Post a reply inside an existing Slack thread.',
  icon: slackIcon,
  inputs: z.object({
    channelId: z.string(),
    threadTs: z.string(),
    text: z.string().min(1),
  }),
  outputs: z.object({
    ts: z.string(),
    permalink: z.string().nullable(),
  }),
  exampleOutput: {
    ts: '1717000456.789012',
    permalink: 'https://acme.slack.com/archives/C0123ABCDEF/p1717000456789012',
  },
  config: { requiresConnection: true, timeout: 10000 },
  execute: replyInSlackThreadExecute,
  agent: { toolsetSlug: 'slack.messages.write' },
})

// src/tools/search-slack-messages.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import searchSlackMessagesExecute from './search-slack-messages.tool.server'

export const searchSlackMessagesTool = defineTool({
  id: 'search_slack_messages',
  name: 'Search Slack messages',
  description:
    'Search messages across the connected Slack workspace. Supports Slack query modifiers like `from:@user`, `in:#channel`, `before:YYYY-MM-DD`. Requires `search:read` scope.',
  icon: slackIcon,
  inputs: z.object({
    query: z
      .string()
      .min(1)
      .describe('Slack search query. Supports `from:@user`, `in:#channel`, `before:YYYY-MM-DD`.'),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputs: z.object({
    messages: z.array(
      z.object({
        ts: z.string(),
        channelId: z.string(),
        channelName: z.string(),
        userId: z.string().nullable(),
        text: z.string(),
        permalink: z.string(),
      })
    ),
  }),
  exampleOutput: {
    messages: [
      {
        ts: '1717000000.123456',
        channelId: 'C0123ABCDEF',
        channelName: 'general',
        userId: 'U0123ABCDEF',
        text: 'Reminder: the customer demo is scheduled for tomorrow at 10am.',
        permalink: 'https://acme.slack.com/archives/C0123ABCDEF/p1717000000123456',
      },
      {
        ts: '1717000789.012345',
        channelId: 'C0456GHIJKL',
        channelName: 'support',
        userId: 'U0456GHIJKL',
        text: 'Resolved the billing ticket for Jane Cooper.',
        permalink: 'https://acme.slack.com/archives/C0456GHIJKL/p1717000789012345',
      },
    ],
  },
  config: { requiresConnection: true, timeout: 15000 },
  execute: searchSlackMessagesExecute,
  agent: { toolsetSlug: 'slack.messages.read' },
})

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
  config: { requiresConnection: true, timeout: 15000 },
  execute: searchSlackMessagesExecute,
  agent: { toolsetSlug: 'slack.messages.read' },
})

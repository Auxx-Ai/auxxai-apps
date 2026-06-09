// src/tools/get-recent-ms-teams-channel-messages.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import getRecentMsTeamsChannelMessagesExecute from './get-recent-ms-teams-channel-messages.tool.server'

export const getRecentMsTeamsChannelMessagesTool = defineTool({
  id: 'get_recent_ms_teams_channel_messages',
  name: 'Get recent Microsoft Teams channel messages',
  description:
    'Fetch the most recent top-level messages in a channel. `replyCount` tells you whether to follow up with `get_ms_teams_message_replies`.',
  icon: msTeamsIcon,
  inputs: z.object({
    teamId: z.string(),
    channelId: z.string(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  outputs: z.object({
    messages: z.array(
      z.object({
        id: z.string(),
        fromUserId: z.string().nullable(),
        fromDisplayName: z.string().nullable(),
        content: z.string(),
        contentType: z.enum(['text', 'html']),
        createdAt: z.string(),
        replyCount: z.number(),
        webUrl: z.string().nullable(),
      })
    ),
  }),
  exampleOutput: {
    messages: [
      {
        id: '1718030999000',
        fromUserId: '8b9f4c21-7d3e-4a1b-9f2c-1a2b3c4d5e6f',
        fromDisplayName: 'Jane Cooper',
        content: 'Reminder: launch retro is at 3pm today.',
        contentType: 'text',
        createdAt: '2026-06-08T13:05:12Z',
        replyCount: 2,
        webUrl:
          'https://teams.microsoft.com/l/message/19%3Aabc123def456ghi789%40thread.tacv2/1718030999000?groupId=2a4b6c8d-1e3f-4a5b-9c7d-0e1f2a3b4c5d&tenantId=11112222-3333-4444-5555-666677778888',
      },
      {
        id: '1718028000000',
        fromUserId: 'a1b2c3d4-5e6f-4789-90ab-cdef12345678',
        fromDisplayName: 'Marcus Lee',
        content: '<p>Deck is finalized — see attached.</p>',
        contentType: 'html',
        createdAt: '2026-06-08T12:15:00Z',
        replyCount: 0,
        webUrl: null,
      },
    ],
  },
  config: { requiresConnection: true, timeout: 15000 },
  execute: getRecentMsTeamsChannelMessagesExecute,
  agent: { toolsetSlug: 'ms-teams.messages.read' },
})

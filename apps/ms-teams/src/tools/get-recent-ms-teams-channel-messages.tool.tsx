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
  config: { requiresConnection: true, timeout: 15000 },
  execute: getRecentMsTeamsChannelMessagesExecute,
})

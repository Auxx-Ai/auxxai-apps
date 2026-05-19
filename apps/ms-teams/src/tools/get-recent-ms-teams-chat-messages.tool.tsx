// src/tools/get-recent-ms-teams-chat-messages.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import getRecentMsTeamsChatMessagesExecute from './get-recent-ms-teams-chat-messages.tool.server'

export const getRecentMsTeamsChatMessagesTool = defineTool({
  id: 'get_recent_ms_teams_chat_messages',
  name: 'Get recent Microsoft Teams chat messages',
  description:
    'Fetch the most recent messages in a 1:1 or group chat. Chats are flat — there is no thread/reply model on this surface.',
  icon: msTeamsIcon,
  inputs: z.object({
    chatId: z.string(),
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
      })
    ),
  }),
  config: { requiresConnection: true, timeout: 15000 },
  execute: getRecentMsTeamsChatMessagesExecute,
})

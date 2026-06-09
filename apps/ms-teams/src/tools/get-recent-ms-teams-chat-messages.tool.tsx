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
  exampleOutput: {
    messages: [
      {
        id: '1718031200456',
        fromUserId: '8b9f4c21-7d3e-4a1b-9f2c-1a2b3c4d5e6f',
        fromDisplayName: 'Jane Cooper',
        content: 'Did the final assets get uploaded?',
        contentType: 'text',
        createdAt: '2026-06-08T14:33:20Z',
      },
      {
        id: '1718031000000',
        fromUserId: 'a1b2c3d4-5e6f-4789-90ab-cdef12345678',
        fromDisplayName: 'Marcus Lee',
        content: '<p>Yes, uploaded to the shared folder.</p>',
        contentType: 'html',
        createdAt: '2026-06-08T14:30:00Z',
      },
    ],
  },
  config: { requiresConnection: true, timeout: 15000 },
  execute: getRecentMsTeamsChatMessagesExecute,
  agent: { toolsetSlug: 'ms-teams.messages.read' },
})

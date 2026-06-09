// src/tools/get-ms-teams-chat.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import getMsTeamsChatExecute from './get-ms-teams-chat.tool.server'

export const getMsTeamsChatTool = defineTool({
  id: 'get_ms_teams_chat',
  name: 'Get Microsoft Teams chat',
  description:
    'Fetch a chat by id, with its members expanded. Use `find_ms_teams_chat` or `list_ms_teams_chats` to discover ids.',
  icon: msTeamsIcon,
  inputs: z.object({
    chatId: z.string(),
  }),
  outputs: z.object({
    id: z.string(),
    topic: z.string().nullable(),
    chatType: z.enum(['oneOnOne', 'group', 'meeting']),
    members: z.array(
      z.object({
        userId: z.string().nullable(),
        displayName: z.string().nullable(),
        email: z.string().nullable(),
      })
    ),
  }),
  exampleOutput: {
    id: '19:meeting_NjQ2YWJmMTEtN2E4YS00@thread.v2',
    topic: 'Q3 Launch Planning',
    chatType: 'group',
    members: [
      {
        userId: '8b9f4c21-7d3e-4a1b-9f2c-1a2b3c4d5e6f',
        displayName: 'Jane Cooper',
        email: 'jane.cooper@contoso.com',
      },
      {
        userId: 'a1b2c3d4-5e6f-4789-90ab-cdef12345678',
        displayName: 'Marcus Lee',
        email: 'marcus.lee@contoso.com',
      },
    ],
  },
  config: { requiresConnection: true, timeout: 10000 },
  execute: getMsTeamsChatExecute,
  agent: { toolsetSlug: 'ms-teams.chats.read' },
})

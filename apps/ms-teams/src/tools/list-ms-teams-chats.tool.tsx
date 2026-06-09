// src/tools/list-ms-teams-chats.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import listMsTeamsChatsExecute from './list-ms-teams-chats.tool.server'

export const listMsTeamsChatsTool = defineTool({
  id: 'list_ms_teams_chats',
  name: 'List Microsoft Teams chats',
  description:
    "List the connected user's chats (1:1, group, and meeting). Use this when the user references a chat by topic or participant without giving a chat id. `topic` is null for 1:1 chats — use `find_ms_teams_chat` to disambiguate by participant.",
  icon: msTeamsIcon,
  inputs: z.object({}),
  outputs: z.object({
    chats: z.array(
      z.object({
        id: z.string(),
        topic: z.string().nullable().describe('Group-chat title. Null for 1:1 chats.'),
        chatType: z.enum(['oneOnOne', 'group', 'meeting']),
        lastUpdatedAt: z.string().nullable(),
      })
    ),
  }),
  exampleOutput: {
    chats: [
      {
        id: '19:meeting_NjQ2YWJmMTEtN2E4YS00@thread.v2',
        topic: 'Q3 Launch Planning',
        chatType: 'group',
        lastUpdatedAt: '2026-06-08T14:33:20Z',
      },
      {
        id: '19:8b9f4c21-7d3e-4a1b-9f2c-1a2b3c4d5e6f_a1b2c3d4-5e6f-4789-90ab-cdef12345678@unq.gbl.spaces',
        topic: null,
        chatType: 'oneOnOne',
        lastUpdatedAt: '2026-06-07T09:42:00Z',
      },
    ],
  },
  config: { requiresConnection: true, timeout: 10000 },
  execute: listMsTeamsChatsExecute,
  agent: {},
})

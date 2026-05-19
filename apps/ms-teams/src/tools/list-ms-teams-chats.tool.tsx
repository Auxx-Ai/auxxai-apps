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
  config: { requiresConnection: true, timeout: 10000 },
  execute: listMsTeamsChatsExecute,
})

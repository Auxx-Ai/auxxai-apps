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
  config: { requiresConnection: true, timeout: 10000 },
  execute: getMsTeamsChatExecute,
})

// src/tools/find-ms-teams-chat.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import findMsTeamsChatExecute from './find-ms-teams-chat.tool.server'

export const findMsTeamsChatTool = defineTool({
  id: 'find_ms_teams_chat',
  name: 'Find Microsoft Teams chat',
  description:
    'Find a 1:1 or group chat. For group chats, matches on `topic`. For 1:1 chats (no topic), matches on a participant email or display name.',
  icon: msTeamsIcon,
  inputs: z.object({
    query: z
      .string()
      .describe('Group chat topic, or an email / display name of a participant for 1:1 chats.'),
  }),
  outputs: z.object({
    chat: z
      .object({
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
      })
      .nullable(),
  }),
  config: { requiresConnection: true, timeout: 15000 },
  execute: findMsTeamsChatExecute,
  agent: { toolsetSlug: 'ms-teams.chats.read' },
})

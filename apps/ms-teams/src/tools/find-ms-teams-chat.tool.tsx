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
  exampleOutput: {
    chat: {
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
  },
  config: { requiresConnection: true, timeout: 15000 },
  execute: findMsTeamsChatExecute,
  agent: { toolsetSlug: 'ms-teams.chats.read' },
})

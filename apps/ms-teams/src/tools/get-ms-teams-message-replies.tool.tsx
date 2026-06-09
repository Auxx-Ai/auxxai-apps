// src/tools/get-ms-teams-message-replies.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import getMsTeamsMessageRepliesExecute from './get-ms-teams-message-replies.tool.server'

export const getMsTeamsMessageRepliesTool = defineTool({
  id: 'get_ms_teams_message_replies',
  name: 'Get Microsoft Teams channel message replies',
  description:
    'Fetch the parent channel message plus its reply thread. Only channel messages have threads — chats are flat.',
  icon: msTeamsIcon,
  inputs: z.object({
    teamId: z.string(),
    channelId: z.string(),
    messageId: z.string().describe('Parent channel message id.'),
  }),
  outputs: z.object({
    parent: z.object({
      id: z.string(),
      fromUserId: z.string().nullable(),
      fromDisplayName: z.string().nullable(),
      content: z.string(),
      contentType: z.enum(['text', 'html']),
      createdAt: z.string(),
    }),
    replies: z.array(
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
    parent: {
      id: '1718030999000',
      fromUserId: '8b9f4c21-7d3e-4a1b-9f2c-1a2b3c4d5e6f',
      fromDisplayName: 'Jane Cooper',
      content: 'Reminder: launch retro is at 3pm today.',
      contentType: 'text',
      createdAt: '2026-06-08T13:05:12Z',
    },
    replies: [
      {
        id: '1718031045123',
        fromUserId: 'a1b2c3d4-5e6f-4789-90ab-cdef12345678',
        fromDisplayName: 'Marcus Lee',
        content: 'Thanks, I will be there.',
        contentType: 'text',
        createdAt: '2026-06-08T13:10:45Z',
      },
      {
        id: '1718031200456',
        fromUserId: 'c3d4e5f6-7a8b-49c0-91d2-3e4f5a6b7c8d',
        fromDisplayName: 'Priya Nair',
        content: '<p>Can we push it to 3:30?</p>',
        contentType: 'html',
        createdAt: '2026-06-08T13:13:20Z',
      },
    ],
  },
  config: { requiresConnection: true, timeout: 15000 },
  execute: getMsTeamsMessageRepliesExecute,
  agent: { toolsetSlug: 'ms-teams.messages.read' },
})

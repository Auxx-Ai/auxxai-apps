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
  config: { requiresConnection: true, timeout: 15000 },
  execute: getMsTeamsMessageRepliesExecute,
})

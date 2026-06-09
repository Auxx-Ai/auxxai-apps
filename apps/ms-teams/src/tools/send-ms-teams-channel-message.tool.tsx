// src/tools/send-ms-teams-channel-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import sendMsTeamsChannelMessageExecute from './send-ms-teams-channel-message.tool.server'

export const sendMsTeamsChannelMessageTool = defineTool({
  id: 'send_ms_teams_channel_message',
  name: 'Send Microsoft Teams channel message',
  description:
    'Post a top-level message to a Microsoft Teams channel. To reply within an existing thread, use `reply_to_ms_teams_channel_message` instead.',
  icon: msTeamsIcon,
  inputs: z.object({
    teamId: z.string(),
    channelId: z.string(),
    contentType: z.enum(['text', 'html']).default('text'),
    content: z.string().min(1),
  }),
  outputs: z.object({
    messageId: z.string(),
    webUrl: z.string().nullable(),
    createdAt: z.string(),
  }),
  exampleOutput: {
    messageId: '1718031400789',
    webUrl:
      'https://teams.microsoft.com/l/message/19%3Aabc123def456ghi789%40thread.tacv2/1718031400789?groupId=2a4b6c8d-1e3f-4a5b-9c7d-0e1f2a3b4c5d&tenantId=11112222-3333-4444-5555-666677778888',
    createdAt: '2026-06-08T14:36:40Z',
  },
  config: { requiresConnection: true, timeout: 15000 },
  execute: sendMsTeamsChannelMessageExecute,
  agent: { toolsetSlug: 'ms-teams.messages.write' },
})

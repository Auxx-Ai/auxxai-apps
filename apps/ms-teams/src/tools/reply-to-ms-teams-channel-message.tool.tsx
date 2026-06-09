// src/tools/reply-to-ms-teams-channel-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import replyToMsTeamsChannelMessageExecute from './reply-to-ms-teams-channel-message.tool.server'

export const replyToMsTeamsChannelMessageTool = defineTool({
  id: 'reply_to_ms_teams_channel_message',
  name: 'Reply to Microsoft Teams channel message',
  description:
    'Reply within an existing channel-message thread. For top-level posts, use `send_ms_teams_channel_message` instead. Chats do not have threads — replies only exist on channel messages.',
  icon: msTeamsIcon,
  inputs: z.object({
    teamId: z.string(),
    channelId: z.string(),
    parentMessageId: z.string(),
    contentType: z.enum(['text', 'html']).default('text'),
    content: z.string().min(1),
  }),
  outputs: z.object({
    messageId: z.string(),
    webUrl: z.string().nullable(),
    createdAt: z.string(),
  }),
  exampleOutput: {
    messageId: '1718031045123',
    webUrl:
      'https://teams.microsoft.com/l/message/19%3Aabc123def456ghi789%40thread.tacv2/1718031045123?groupId=2a4b6c8d-1e3f-4a5b-9c7d-0e1f2a3b4c5d&tenantId=11112222-3333-4444-5555-666677778888&parentMessageId=1718030999000',
    createdAt: '2026-06-08T14:30:45Z',
  },
  config: { requiresConnection: true, timeout: 15000 },
  execute: replyToMsTeamsChannelMessageExecute,
  agent: { toolsetSlug: 'ms-teams.messages.write' },
})

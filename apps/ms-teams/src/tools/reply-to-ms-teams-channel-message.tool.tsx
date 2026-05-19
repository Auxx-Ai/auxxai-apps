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
  config: { requiresConnection: true, timeout: 15000 },
  execute: replyToMsTeamsChannelMessageExecute,
})

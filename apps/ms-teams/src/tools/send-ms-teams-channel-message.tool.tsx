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
  config: { requiresConnection: true, timeout: 15000 },
  execute: sendMsTeamsChannelMessageExecute,
  agent: { toolsetSlug: 'ms-teams.messages.write' },
})

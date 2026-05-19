// src/tools/send-ms-teams-chat-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import sendMsTeamsChatMessageExecute from './send-ms-teams-chat-message.tool.server'

export const sendMsTeamsChatMessageTool = defineTool({
  id: 'send_ms_teams_chat_message',
  name: 'Send Microsoft Teams chat message',
  description:
    'Post a message to a 1:1 or group chat. Chats are flat (no threads). For channel posts use `send_ms_teams_channel_message` instead.',
  icon: msTeamsIcon,
  inputs: z.object({
    chatId: z.string(),
    contentType: z.enum(['text', 'html']).default('text'),
    content: z.string().min(1),
  }),
  outputs: z.object({
    messageId: z.string(),
    createdAt: z.string(),
  }),
  config: { requiresConnection: true, timeout: 15000 },
  execute: sendMsTeamsChatMessageExecute,
})

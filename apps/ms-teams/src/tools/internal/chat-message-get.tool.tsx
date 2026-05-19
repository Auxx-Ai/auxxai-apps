// src/tools/internal/chat-message-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import chatMessageGetExecute from './chat-message-get.tool.server'

export const chatMessageGetTool = defineTool({
  id: 'block_ms_teams_chat_message_get',
  name: 'Microsoft Teams: get chat message (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: chatMessageGetExecute,
})

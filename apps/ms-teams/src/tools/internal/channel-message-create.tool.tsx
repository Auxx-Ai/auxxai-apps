// src/tools/internal/channel-message-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import channelMessageCreateExecute from './channel-message-create.tool.server'

export const channelMessageCreateTool = defineTool({
  id: 'block_ms_teams_channel_message_create',
  name: 'Microsoft Teams: send channel message (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: channelMessageCreateExecute,
})

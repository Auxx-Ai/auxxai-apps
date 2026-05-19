// src/tools/internal/channel-message-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import channelMessageGetManyExecute from './channel-message-get-many.tool.server'

export const channelMessageGetManyTool = defineTool({
  id: 'block_ms_teams_channel_message_get_many',
  name: 'Microsoft Teams: get channel messages (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: channelMessageGetManyExecute,
})

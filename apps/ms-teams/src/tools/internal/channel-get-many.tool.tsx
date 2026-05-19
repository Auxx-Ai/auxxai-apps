// src/tools/internal/channel-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import channelGetManyExecute from './channel-get-many.tool.server'

export const channelGetManyTool = defineTool({
  id: 'block_ms_teams_channel_get_many',
  name: 'Microsoft Teams: list channels (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: channelGetManyExecute,
})

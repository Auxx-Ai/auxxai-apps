// src/tools/internal/channel-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import channelGetExecute from './channel-get.tool.server'

export const channelGetTool = defineTool({
  id: 'block_ms_teams_channel_get',
  name: 'Microsoft Teams: get channel (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: channelGetExecute,
})

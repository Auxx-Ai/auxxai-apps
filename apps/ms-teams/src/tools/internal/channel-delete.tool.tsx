// src/tools/internal/channel-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import channelDeleteExecute from './channel-delete.tool.server'

export const channelDeleteTool = defineTool({
  id: 'block_ms_teams_channel_delete',
  name: 'Microsoft Teams: delete channel (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: channelDeleteExecute,
})

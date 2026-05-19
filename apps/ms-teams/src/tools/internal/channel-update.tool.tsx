// src/tools/internal/channel-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import channelUpdateExecute from './channel-update.tool.server'

export const channelUpdateTool = defineTool({
  id: 'block_ms_teams_channel_update',
  name: 'Microsoft Teams: update channel (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: channelUpdateExecute,
})

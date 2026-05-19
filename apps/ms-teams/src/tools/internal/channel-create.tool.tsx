// src/tools/internal/channel-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../../assets/icon.png'
import channelCreateExecute from './channel-create.tool.server'

export const channelCreateTool = defineTool({
  id: 'block_ms_teams_channel_create',
  name: 'Microsoft Teams: create channel (block-internal)',
  description: 'Internal tool backing the Microsoft Teams workflow block. Not exposed to agents.',
  icon: msTeamsIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: channelCreateExecute,
})

// src/tools/get-ms-teams-channel.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import getMsTeamsChannelExecute from './get-ms-teams-channel.tool.server'

export const getMsTeamsChannelTool = defineTool({
  id: 'get_ms_teams_channel',
  name: 'Get Microsoft Teams channel',
  description:
    'Fetch full details for a single channel. Channels are not addressable without their parent Team — both ids are required.',
  icon: msTeamsIcon,
  inputs: z.object({
    teamId: z.string(),
    channelId: z.string(),
  }),
  outputs: z.object({
    id: z.string(),
    displayName: z.string(),
    description: z.string().nullable(),
    membershipType: z.enum(['standard', 'private', 'shared']),
    webUrl: z.string().nullable(),
    createdAt: z.string().nullable(),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: getMsTeamsChannelExecute,
})

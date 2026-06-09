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
  exampleOutput: {
    id: '19:abc123def456ghi789@thread.tacv2',
    displayName: 'General',
    description: 'Company-wide announcements and team updates.',
    membershipType: 'standard',
    webUrl:
      'https://teams.microsoft.com/l/channel/19%3Aabc123def456ghi789%40thread.tacv2/General?groupId=2a4b6c8d-1e3f-4a5b-9c7d-0e1f2a3b4c5d&tenantId=11112222-3333-4444-5555-666677778888',
    createdAt: '2025-11-02T08:15:00Z',
  },
  config: { requiresConnection: true, timeout: 10000 },
  execute: getMsTeamsChannelExecute,
  agent: { toolsetSlug: 'ms-teams.channels.read' },
})

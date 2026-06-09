// src/tools/find-ms-teams-channel.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import findMsTeamsChannelExecute from './find-ms-teams-channel.tool.server'

export const findMsTeamsChannelTool = defineTool({
  id: 'find_ms_teams_channel',
  name: 'Find Microsoft Teams channel',
  description:
    'Find a channel by display name within a Team. `teamId` is required because channel names are not unique across teams. Use `list_ms_teams_teams` to discover team ids.',
  icon: msTeamsIcon,
  inputs: z.object({
    teamId: z
      .string()
      .describe('Team id (from list_ms_teams_teams). Channel names are not unique across teams.'),
    query: z.string().describe('Channel display name (with or without #).'),
  }),
  outputs: z.object({
    channel: z
      .object({
        id: z.string(),
        displayName: z.string(),
        description: z.string().nullable(),
        membershipType: z.enum(['standard', 'private', 'shared']),
        webUrl: z.string().nullable(),
      })
      .nullable(),
  }),
  exampleOutput: {
    channel: {
      id: '19:abc123def456ghi789@thread.tacv2',
      displayName: 'General',
      description: 'Company-wide announcements and team updates.',
      membershipType: 'standard',
      webUrl:
        'https://teams.microsoft.com/l/channel/19%3Aabc123def456ghi789%40thread.tacv2/General?groupId=2a4b6c8d-1e3f-4a5b-9c7d-0e1f2a3b4c5d&tenantId=11112222-3333-4444-5555-666677778888',
    },
  },
  config: { requiresConnection: true, timeout: 10000 },
  execute: findMsTeamsChannelExecute,
  agent: { toolsetSlug: 'ms-teams.channels.read' },
})

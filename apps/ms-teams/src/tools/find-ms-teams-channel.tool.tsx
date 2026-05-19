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
  config: { requiresConnection: true, timeout: 10000 },
  execute: findMsTeamsChannelExecute,
})

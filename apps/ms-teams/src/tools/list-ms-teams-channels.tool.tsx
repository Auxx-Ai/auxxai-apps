// src/tools/list-ms-teams-channels.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import listMsTeamsChannelsExecute from './list-ms-teams-channels.tool.server'

export const listMsTeamsChannelsTool = defineTool({
  id: 'list_ms_teams_channels',
  name: 'List Microsoft Teams channels',
  description:
    'List all channels in a Team. Use `list_ms_teams_teams` first to discover the team id. Channels live under their parent Team — there is no workspace-wide channel list.',
  icon: msTeamsIcon,
  inputs: z.object({
    teamId: z.string(),
  }),
  outputs: z.object({
    channels: z.array(
      z.object({
        id: z.string(),
        displayName: z.string(),
        description: z.string().nullable(),
        membershipType: z.enum(['standard', 'private', 'shared']),
      })
    ),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: listMsTeamsChannelsExecute,
  agent: { toolsetSlug: 'ms-teams.channels.read' },
})

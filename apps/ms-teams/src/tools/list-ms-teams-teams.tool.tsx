// src/tools/list-ms-teams-teams.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import listMsTeamsTeamsExecute from './list-ms-teams-teams.tool.server'

export const listMsTeamsTeamsTool = defineTool({
  id: 'list_ms_teams_teams',
  name: 'List Microsoft Teams',
  description:
    'List Teams (the top-level container with channels) the connected user has joined. Use this when the user references "the marketing team" without giving a Team id.',
  icon: msTeamsIcon,
  inputs: z.object({}),
  outputs: z.object({
    teams: z.array(
      z.object({
        id: z.string(),
        displayName: z.string(),
        description: z.string().nullable(),
      })
    ),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: listMsTeamsTeamsExecute,
  agent: {},
})

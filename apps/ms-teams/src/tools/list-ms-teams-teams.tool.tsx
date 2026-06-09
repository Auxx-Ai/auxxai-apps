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
  exampleOutput: {
    teams: [
      {
        id: '2a4b6c8d-1e3f-4a5b-9c7d-0e1f2a3b4c5d',
        displayName: 'Marketing',
        description: 'Marketing team workspace for campaigns and content.',
      },
      {
        id: '7f8e9d0c-1b2a-4c3d-8e5f-6a7b8c9d0e1f',
        displayName: 'Engineering',
        description: null,
      },
    ],
  },
  config: { requiresConnection: true, timeout: 10000 },
  execute: listMsTeamsTeamsExecute,
  agent: {},
})

// src/tools/list-ms-teams-teams.tool.server.ts

import { graphPaginatedGet } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsTeam, mapTeam } from './shared/map-team'

interface ListMsTeamsTeamsOutput {
  teams: MappedMsTeamsTeam[]
}

export default async function listMsTeamsTeams(): Promise<ListMsTeamsTeamsOutput> {
  const { token } = getMsTeamsConnection()
  const { items } = await graphPaginatedGet<unknown>('/me/joinedTeams', token, {
    returnAll: true,
  })

  const teams = items.map(mapTeam)
  teams.sort((a, b) => a.displayName.localeCompare(b.displayName))
  return { teams }
}

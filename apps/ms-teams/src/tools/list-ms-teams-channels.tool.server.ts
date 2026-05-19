// src/tools/list-ms-teams-channels.tool.server.ts

import { graphPaginatedGet } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsChannel, mapChannel } from './shared/map-channel'

interface ListMsTeamsChannelsInput {
  teamId: string
}

interface ListMsTeamsChannelsOutput {
  channels: MappedMsTeamsChannel[]
}

export default async function listMsTeamsChannels(
  input: ListMsTeamsChannelsInput
): Promise<ListMsTeamsChannelsOutput> {
  const { token } = getMsTeamsConnection()
  const { items } = await graphPaginatedGet<unknown>(`/teams/${input.teamId}/channels`, token, {
    returnAll: true,
  })

  const channels = items.map(mapChannel)
  channels.sort((a, b) => a.displayName.localeCompare(b.displayName))
  return { channels }
}

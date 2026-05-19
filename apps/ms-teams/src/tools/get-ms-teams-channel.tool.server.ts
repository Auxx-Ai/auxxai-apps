// src/tools/get-ms-teams-channel.tool.server.ts

import { graphApi } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsChannelFull, mapChannelFull } from './shared/map-channel'

interface GetMsTeamsChannelInput {
  teamId: string
  channelId: string
}

export default async function getMsTeamsChannel(
  input: GetMsTeamsChannelInput
): Promise<MappedMsTeamsChannelFull> {
  const { token } = getMsTeamsConnection()
  const raw = await graphApi<unknown>(
    'GET',
    `/teams/${input.teamId}/channels/${input.channelId}`,
    token
  )
  return mapChannelFull(raw)
}

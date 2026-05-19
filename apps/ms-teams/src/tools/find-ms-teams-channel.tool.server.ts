// src/tools/find-ms-teams-channel.tool.server.ts

import { graphPaginatedGet } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsChannelDetail, mapChannelDetail } from './shared/map-channel'

interface FindMsTeamsChannelInput {
  teamId: string
  query: string
}

interface FindMsTeamsChannelOutput {
  channel: MappedMsTeamsChannelDetail | null
}

export default async function findMsTeamsChannel(
  input: FindMsTeamsChannelInput
): Promise<FindMsTeamsChannelOutput> {
  const { token } = getMsTeamsConnection()
  const query = input.query.trim().replace(/^#/, '').toLowerCase()
  if (!query) return { channel: null }

  const { items } = await graphPaginatedGet<unknown>(`/teams/${input.teamId}/channels`, token, {
    returnAll: true,
  })

  for (const raw of items) {
    const mapped = mapChannelDetail(raw)
    if (mapped.displayName.toLowerCase() === query) {
      return { channel: mapped }
    }
  }

  // Substring fallback — useful when the LLM passes "general chat" for "General".
  for (const raw of items) {
    const mapped = mapChannelDetail(raw)
    if (mapped.displayName.toLowerCase().includes(query)) {
      return { channel: mapped }
    }
  }

  return { channel: null }
}

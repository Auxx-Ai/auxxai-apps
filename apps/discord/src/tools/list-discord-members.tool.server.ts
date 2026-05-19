// src/tools/list-discord-members.tool.server.ts

import { BlockRuntimeError } from '@auxx/sdk/shared'
import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'
import { type MappedMember, mapMember } from './shared/map-member'

interface ListDiscordMembersInput {
  guildId: string
  q?: string
  limit?: number
}

interface ListDiscordMembersOutput {
  members: MappedMember[]
  truncated: boolean
}

const PAGE_SIZE = 1000

export default async function listDiscordMembers(
  input: ListDiscordMembersInput
): Promise<ListDiscordMembersOutput> {
  const token = getDiscordToken()
  const limit = Math.min(input.limit ?? 100, 1000)

  const params = new URLSearchParams({ limit: String(Math.min(PAGE_SIZE, limit)) })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let raw: any[]
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw = await discordApi<any[]>(`/guilds/${input.guildId}/members?${params}`, token)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/permission/i.test(message) || /50001/.test(message)) {
      throw new BlockRuntimeError(
        'Cannot list members — the Server Members Intent is not enabled for this bot. Enable it in the Discord Developer Portal under the bot settings, then retry.',
        'PRIVILEGED_INTENT_MISSING'
      )
    }
    throw err
  }

  // Empty response when intent is missing on some guild configurations.
  if (raw.length === 0) {
    return { members: [], truncated: false }
  }

  let members = raw.map(mapMember)

  if (input.q) {
    const needle = input.q.toLowerCase()
    members = members.filter(
      (m) =>
        m.username.toLowerCase().includes(needle) || m.displayName.toLowerCase().includes(needle)
    )
  }

  const truncated = raw.length >= PAGE_SIZE && members.length >= limit
  return { members: members.slice(0, limit), truncated }
}

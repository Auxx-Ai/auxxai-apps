// src/tools/search-discord-messages.tool.server.ts

import { BlockRuntimeError } from '@auxx/sdk/shared'
import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'
import { type MappedMessageMatch, mapMessageMatch } from './shared/map-message'

interface SearchDiscordMessagesInput {
  channelIds: string[]
  q?: string
  authorId?: string
  since?: string
  limit?: number
}

interface SearchDiscordMessagesOutput {
  matches: MappedMessageMatch[]
  truncated: boolean
}

const PAGE_SIZE = 100
const MAX_PAGES_PER_CHANNEL = 5

export default async function searchDiscordMessages(
  input: SearchDiscordMessagesInput
): Promise<SearchDiscordMessagesOutput> {
  // Re-check zod .refine() bounds the converter strips on JSON Schema emit.
  if (!input.channelIds || input.channelIds.length < 1 || input.channelIds.length > 5) {
    throw new BlockRuntimeError(
      'channelIds must contain between 1 and 5 channel ids.',
      'INVALID_INPUT'
    )
  }

  const token = getDiscordToken()
  const limit = Math.min(input.limit ?? 25, 100)
  const sinceMs = input.since
    ? new Date(input.since).getTime()
    : Date.now() - 7 * 24 * 60 * 60 * 1000
  const needle = input.q?.toLowerCase()

  const matches: MappedMessageMatch[] = []
  let truncated = false

  // Resolve channel names up front (one cheap call per channel).
  const channelNames = new Map<string, string>()
  for (const channelId of input.channelIds) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ch = await discordApi<any>(`/channels/${channelId}`, token)
      channelNames.set(channelId, ch?.name ?? channelId)
    } catch {
      channelNames.set(channelId, channelId)
    }
  }

  for (const channelId of input.channelIds) {
    if (matches.length >= limit) {
      truncated = true
      break
    }

    const channelName = channelNames.get(channelId) ?? channelId
    let before: string | undefined
    let pages = 0
    let stopChannel = false

    while (!stopChannel && pages < MAX_PAGES_PER_CHANNEL && matches.length < limit) {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
      if (before) params.set('before', before)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const page = await discordApi<any[]>(`/channels/${channelId}/messages?${params}`, token)
      if (!page.length) break

      for (const m of page) {
        const tsMs = m?.timestamp ? new Date(m.timestamp).getTime() : 0
        if (tsMs && tsMs < sinceMs) {
          stopChannel = true
          break
        }

        if (input.authorId && m?.author?.id !== input.authorId) continue
        if (needle && !(m?.content ?? '').toLowerCase().includes(needle)) continue

        matches.push(mapMessageMatch(m, channelId, channelName))
        if (matches.length >= limit) {
          truncated = true
          break
        }
      }

      before = page[page.length - 1]?.id
      pages++
    }

    if (pages >= MAX_PAGES_PER_CHANNEL) truncated = true
  }

  return { matches, truncated }
}

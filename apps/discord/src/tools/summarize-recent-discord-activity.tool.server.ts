// src/tools/summarize-recent-discord-activity.tool.server.ts

import { BlockRuntimeError } from '@auxx/sdk/shared'
import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'

interface SummarizeRecentDiscordActivityInput {
  guildId: string
  channelIds?: string[]
  since?: string
  perChannelLimit?: number
}

interface ChannelSummary {
  channelId: string
  channelName: string
  messageCount: number
  uniqueAuthors: number
  sampleMessages: Array<{
    authorUsername: string
    content: string
    timestamp: string
  }>
}

interface SummarizeRecentDiscordActivityOutput {
  summary: string
  channels: ChannelSummary[]
}

// Discord channel type for plain guild text channels.
const GUILD_TEXT = 0

/**
 * Streaming tool — walks N channels of a guild, yields per-channel progress
 * while fetching, and returns an aggregated summary. Mirrors Shopify's
 * `summarize_recent_orders`. See plans/kopilot/apps/discord-overhaul.md §4.9.
 */
export default async function* summarizeRecentDiscordActivity(
  input: SummarizeRecentDiscordActivityInput
): AsyncGenerator<{ kind: string; data: unknown }, SummarizeRecentDiscordActivityOutput, void> {
  const token = getDiscordToken()
  const perChannelLimit = Math.min(input.perChannelLimit ?? 50, 100)
  const sinceMs = input.since ? new Date(input.since).getTime() : Date.now() - 24 * 60 * 60 * 1000

  yield { kind: 'phase', data: { phase: 'starting' } }

  // Resolve channels to walk.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guildChannels = await discordApi<any[]>(`/guilds/${input.guildId}/channels`, token)
  const textChannels = guildChannels.filter((c) => c?.type === GUILD_TEXT)

  let walk: Array<{ id: string; name: string }>
  if (input.channelIds?.length) {
    // Re-check the stripped .max(10) bound.
    if (input.channelIds.length > 10) {
      throw new BlockRuntimeError('channelIds may contain at most 10 channel ids.', 'INVALID_INPUT')
    }
    const byId = new Map(textChannels.map((c) => [c.id, c.name as string]))
    walk = input.channelIds.map((id) => ({ id, name: byId.get(id) ?? id }))
  } else {
    // Default: top 10 text channels by position (Discord lists them in their
    // configured order; finer "most recently active" requires extra API calls
    // we skip here per the rate-limit budget).
    walk = textChannels.slice(0, 10).map((c) => ({ id: c.id as string, name: c.name as string }))
  }

  if (walk.length > 10) {
    throw new BlockRuntimeError('resolved channel list exceeded cap of 10.', 'INVALID_INPUT')
  }

  yield { kind: 'phase', data: { phase: 'found', total: walk.length } }

  const channels: ChannelSummary[] = []
  let totalMessages = 0
  const authorCounts = new Map<string, number>()

  for (let i = 0; i < walk.length; i++) {
    const { id: channelId, name: channelName } = walk[i]

    yield {
      kind: 'phase',
      data: { phase: 'fetching', idx: i + 1, total: walk.length, channelName },
    }

    const params = new URLSearchParams({ limit: String(perChannelLimit) })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let raw: any[] = []
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      raw = await discordApi<any[]>(`/channels/${channelId}/messages?${params}`, token)
    } catch (err) {
      // Skip channels the bot can't read; keep the summary moving.
      yield {
        kind: 'phase',
        data: {
          phase: 'channel-error',
          channelName,
          message: err instanceof Error ? err.message : String(err),
        },
      }
      channels.push({
        channelId,
        channelName,
        messageCount: 0,
        uniqueAuthors: 0,
        sampleMessages: [],
      })
      continue
    }

    const recent = raw.filter((m) => {
      const ts = m?.timestamp ? new Date(m.timestamp).getTime() : 0
      return ts >= sinceMs
    })

    const authors = new Set<string>()
    for (const m of recent) {
      const username = m?.author?.username ?? ''
      if (username) {
        authors.add(username)
        authorCounts.set(username, (authorCounts.get(username) ?? 0) + 1)
      }
    }

    const sample = recent.slice(0, 3).map((m) => ({
      authorUsername: m?.author?.username ?? '',
      content: m?.content ?? '',
      timestamp: m?.timestamp ?? '',
    }))

    channels.push({
      channelId,
      channelName,
      messageCount: recent.length,
      uniqueAuthors: authors.size,
      sampleMessages: sample,
    })
    totalMessages += recent.length

    yield {
      kind: 'phase',
      data: {
        phase: 'fetched',
        idx: i + 1,
        total: walk.length,
        channelName,
        messageCount: recent.length,
      },
    }
  }

  return { summary: buildSummary(channels, totalMessages, authorCounts), channels }
}

function buildSummary(
  channels: ChannelSummary[],
  totalMessages: number,
  authorCounts: Map<string, number>
): string {
  if (totalMessages === 0) {
    return 'No messages in the requested window across the scanned channels.'
  }

  const topChannels = [...channels]
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 3)
    .filter((c) => c.messageCount > 0)
    .map((c) => `#${c.channelName} (${c.messageCount})`)
    .join(', ')

  const topAuthors = [...authorCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => `${name} (${count})`)
    .join(', ')

  return [
    `${totalMessages} messages across ${channels.length} channels.`,
    topChannels ? `Top channels: ${topChannels}.` : null,
    topAuthors ? `Top authors: ${topAuthors}.` : null,
  ]
    .filter(Boolean)
    .join(' ')
}

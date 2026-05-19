// src/tools/find-slack-channel.tool.server.ts

import { slackApi } from '../blocks/slack/shared/slack-api'
import { getSlackConnection } from './shared/connection'
import { type MappedSlackChannelDetail, mapChannelDetail } from './shared/map-channel'
import { parseChannelIdFromUrl } from './shared/parse-channel-url'

interface FindSlackChannelInput {
  query: string
}

interface FindSlackChannelOutput {
  channel: Omit<MappedSlackChannelDetail, 'isArchived'> | null
}

export default async function findSlackChannel(
  input: FindSlackChannelInput
): Promise<FindSlackChannelOutput> {
  const { token } = getSlackConnection()
  const query = input.query.trim()

  if (!query) return { channel: null }

  // If the query looks like a Slack URL, parse the channel id out of it
  // and resolve via conversations.info.
  const urlId = query.startsWith('http') ? parseChannelIdFromUrl(query) : null
  if (urlId) {
    return resolveById(token, urlId)
  }

  // If the query looks like a channel id (starts with C/G + uppercase letters),
  // try info directly.
  if (/^[CGD][A-Z0-9]{6,}$/.test(query)) {
    return resolveById(token, query)
  }

  const name = query.replace(/^#/, '').toLowerCase()
  let cursor: string | undefined

  do {
    const response = await slackApi('conversations.list', token, {
      types: 'public_channel,private_channel',
      exclude_archived: false,
      limit: 200,
      ...(cursor ? { cursor } : {}),
    })

    for (const ch of response.channels ?? []) {
      if (ch.name?.toLowerCase() === name) {
        // biome-ignore lint/suspicious/noExplicitAny: re-fetch via info for richer fields.
        const info = await slackApi('conversations.info', token, { channel: ch.id })
        const channel = (info.channel ?? ch) as unknown
        const mapped = mapChannelDetail(channel)
        return {
          channel: {
            id: mapped.id,
            name: mapped.name,
            isPrivate: mapped.isPrivate,
            memberCount: mapped.memberCount,
            topic: mapped.topic,
            purpose: mapped.purpose,
          },
        }
      }
    }

    cursor = response.response_metadata?.next_cursor || undefined
  } while (cursor)

  return { channel: null }
}

async function resolveById(token: string, channelId: string): Promise<FindSlackChannelOutput> {
  try {
    const info = await slackApi('conversations.info', token, { channel: channelId })
    if (!info.channel) return { channel: null }
    const mapped = mapChannelDetail(info.channel)
    return {
      channel: {
        id: mapped.id,
        name: mapped.name,
        isPrivate: mapped.isPrivate,
        memberCount: mapped.memberCount,
        topic: mapped.topic,
        purpose: mapped.purpose,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.toLowerCase().includes('channel_not_found') || message.includes('not found')) {
      return { channel: null }
    }
    throw error
  }
}

// src/tools/list-slack-channels.tool.server.ts

import { slackApi } from '../blocks/slack/shared/slack-api'
import { getSlackConnection } from './shared/connection'
import { type MappedSlackChannel, mapChannel } from './shared/map-channel'

interface ListSlackChannelsOutput {
  channels: MappedSlackChannel[]
}

export default async function listSlackChannels(): Promise<ListSlackChannelsOutput> {
  const { token } = getSlackConnection()
  const channels: MappedSlackChannel[] = []
  let cursor: string | undefined

  do {
    const response = await slackApi('conversations.list', token, {
      types: 'public_channel,private_channel',
      exclude_archived: false,
      limit: 200,
      ...(cursor ? { cursor } : {}),
    })

    for (const ch of response.channels ?? []) {
      channels.push(mapChannel(ch))
    }

    cursor = response.response_metadata?.next_cursor || undefined
  } while (cursor)

  channels.sort((a, b) => a.name.localeCompare(b.name))
  return { channels }
}

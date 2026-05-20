// src/tools/list-discord-messages.tool.server.ts

import { discordPaginatedGet } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'

interface ListDiscordMessagesInput {
  channelId: string
  returnAll?: boolean
  limit?: number
}

interface ListDiscordMessagesOutput {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[]
  totalCount: string
  truncated: string
}

export default async function listDiscordMessages(
  input: ListDiscordMessagesInput
): Promise<ListDiscordMessagesOutput> {
  const token = getDiscordToken()
  const returnAll = input.returnAll ?? false
  const limit = input.limit ?? 50

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { items, truncated } = await discordPaginatedGet<any>(
    `/channels/${input.channelId}/messages`,
    token,
    {
      returnAll,
      limit,
      cursorParam: 'before',
      pageSize: 100,
    }
  )

  return {
    messages: items,
    totalCount: String(items.length),
    truncated: String(truncated),
  }
}

// src/tools/search-slack-messages.tool.server.ts

import { slackApi } from '../blocks/slack/shared/slack-api'
import { getSlackConnection } from './shared/connection'
import { type MappedSearchHit, mapSearchHit } from './shared/map-message'

interface SearchSlackMessagesInput {
  query: string
  limit?: number
}

interface SearchSlackMessagesOutput {
  messages: MappedSearchHit[]
}

export default async function searchSlackMessages(
  input: SearchSlackMessagesInput
): Promise<SearchSlackMessagesOutput> {
  const { token } = getSlackConnection()
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50)

  try {
    const response = await slackApi('search.messages', token, {
      query: input.query,
      count: limit,
      sort: 'timestamp',
      sort_dir: 'desc',
    })
    // biome-ignore lint/suspicious/noExplicitAny: search.messages returns dynamic shape.
    const matches = ((response as any)?.messages?.matches ?? []) as unknown[]
    return { messages: matches.map(mapSearchHit) }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.toLowerCase().includes('missing') && message.toLowerCase().includes('scope')) {
      const err = new Error(
        'Slack workspace is missing the `search:read` scope. Reconnect Slack to grant it.'
      ) as Error & { code: string }
      err.code = 'MISSING_SCOPE'
      throw err
    }
    throw error
  }
}

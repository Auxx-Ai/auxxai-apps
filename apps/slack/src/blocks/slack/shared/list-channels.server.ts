// src/blocks/slack/shared/list-channels.server.ts

/**
 * Server function that fetches the list of channels from the connected
 * Slack workspace via `conversations.list`. Used by the panel to populate
 * the "From List" channel dropdown.
 *
 * Requires bot scopes: channels:read, groups:read
 */

import { getOrganizationConnection } from '@auxx/sdk/server'
import { slackApi, throwConnectionNotFound } from './slack-api'

export default async function listChannels(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) {
    throwConnectionNotFound()
  }

  const token = connection.value
  const channels: { label: string; value: string }[] = []
  let cursor: string | undefined

  do {
    const response = await slackApi('conversations.list', token, {
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 200,
      ...(cursor ? { cursor } : {}),
    })

    for (const ch of response.channels ?? []) {
      channels.push({
        label: `#${ch.name}`,
        value: ch.id,
      })
    }

    cursor = response.response_metadata?.next_cursor || undefined
  } while (cursor)

  return channels.sort((a, b) => a.label.localeCompare(b.label))
}

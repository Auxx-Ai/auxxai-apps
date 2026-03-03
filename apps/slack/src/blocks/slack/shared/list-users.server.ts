// src/blocks/slack/shared/list-users.server.ts

/**
 * Server function that fetches the list of workspace members from the
 * connected Slack workspace via `users.list`. Used by the panel to
 * populate the "From List" user dropdown.
 *
 * Filters out bots, deactivated users, and Slackbot.
 *
 * Requires bot scope: users:read
 */

import { getOrganizationConnection } from '@auxx/sdk/server'
import { slackApi, throwConnectionNotFound } from './slack-api'

export default async function listUsers(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) {
    throwConnectionNotFound()
  }

  const token = connection.value
  const users: { label: string; value: string }[] = []
  let cursor: string | undefined

  do {
    const response = await slackApi('users.list', token, {
      limit: 200,
      ...(cursor ? { cursor } : {}),
    })

    for (const user of response.members ?? []) {
      if (user.deleted || user.is_bot || user.id === 'USLACKBOT') continue

      const displayName = user.profile?.display_name || user.real_name || user.name
      users.push({
        label: displayName,
        value: user.id,
      })
    }

    cursor = response.response_metadata?.next_cursor || undefined
  } while (cursor)

  return users.sort((a, b) => a.label.localeCompare(b.label))
}

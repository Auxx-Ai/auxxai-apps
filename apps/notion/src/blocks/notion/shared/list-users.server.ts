// src/blocks/notion/shared/list-users.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { notionApi, throwConnectionNotFound } from './notion-api'

/**
 * Fetch all workspace users accessible to the integration.
 */
export default async function listUsers(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const users: { label: string; value: string }[] = []
  let cursor: string | undefined

  do {
    const query: Record<string, string> = {
      page_size: '100',
      ...(cursor ? { start_cursor: cursor } : {}),
    }

    const response = await notionApi('GET', '/users', token, { query })

    for (const user of response.results ?? []) {
      const name = user.name || user.id
      users.push({
        label: `${name}${user.type === 'bot' ? ' (bot)' : ''}`,
        value: user.id,
      })
    }

    cursor = response.has_more ? response.next_cursor : undefined
  } while (cursor)

  return users.sort((a, b) => a.label.localeCompare(b.label))
}

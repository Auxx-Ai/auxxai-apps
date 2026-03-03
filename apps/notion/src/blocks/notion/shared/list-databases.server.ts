// src/blocks/notion/shared/list-databases.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { notionApi, throwConnectionNotFound } from './notion-api'

/**
 * Fetch all databases accessible to the integration.
 * Uses the search API with an object filter since Notion has no dedicated list-databases endpoint.
 */
export default async function listDatabases(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const databases: { label: string; value: string }[] = []
  let cursor: string | undefined

  do {
    const body: Record<string, unknown> = {
      filter: { property: 'object', value: 'database' },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    }

    const response = await notionApi('POST', '/search', token, { body })

    for (const db of response.results ?? []) {
      const title = db.title?.map((t: any) => t.plain_text).join('') || db.id
      databases.push({
        label: title,
        value: db.id,
      })
    }

    cursor = response.has_more ? response.next_cursor : undefined
  } while (cursor)

  return databases.sort((a, b) => a.label.localeCompare(b.label))
}

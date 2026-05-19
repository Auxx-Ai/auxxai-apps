// src/tools/list-notion-databases.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import { notionApi, throwConnectionNotFound } from '../blocks/notion/shared/notion-api'
import { mapDatabaseSummary, type MappedNotionDatabaseSummary } from './shared/map-database'

interface ListNotionDatabasesOutput {
  databases: MappedNotionDatabaseSummary[]
}

export default async function listNotionDatabases(): Promise<ListNotionDatabasesOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const databases: MappedNotionDatabaseSummary[] = []
  let cursor: string | undefined

  do {
    const body: Record<string, unknown> = {
      filter: { property: 'object', value: 'database' },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    }
    const response = await notionApi('POST', '/search', token, { body })

    for (const db of response.results ?? []) {
      databases.push(mapDatabaseSummary(db))
    }
    cursor = response.has_more ? response.next_cursor : undefined
  } while (cursor)

  databases.sort((a, b) => a.title.localeCompare(b.title))

  return { databases }
}

// src/tools/find-notion-database.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import { notionApi, throwConnectionNotFound } from '../blocks/notion/shared/notion-api'
import { mapDatabaseSummary, type MappedNotionDatabaseSummary } from './shared/map-database'

interface FindNotionDatabaseInput {
  query: string
  limit?: number
}

interface FindNotionDatabaseOutput {
  found: boolean
  databases: Array<{ databaseId: string; title: string; url: string }>
}

export default async function findNotionDatabase(
  input: FindNotionDatabaseInput
): Promise<FindNotionDatabaseOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const response = await notionApi('POST', '/search', token, {
    body: {
      query: input.query,
      filter: { property: 'object', value: 'database' },
      page_size: input.limit ?? 3,
    },
  })

  const databases = (response.results ?? [])
    .map(mapDatabaseSummary)
    .map(({ databaseId, title, url }: MappedNotionDatabaseSummary) => ({ databaseId, title, url }))

  return { found: databases.length > 0, databases }
}

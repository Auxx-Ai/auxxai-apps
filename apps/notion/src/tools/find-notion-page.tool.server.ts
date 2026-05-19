// src/tools/find-notion-page.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import { notionApi, throwConnectionNotFound } from '../blocks/notion/shared/notion-api'
import { mapPageSummary, type MappedNotionPageSummary } from './shared/map-page'

interface FindNotionPageInput {
  query: string
  limit?: number
}

interface FindNotionPageOutput {
  found: boolean
  pages: MappedNotionPageSummary[]
}

export default async function findNotionPage(
  input: FindNotionPageInput
): Promise<FindNotionPageOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const response = await notionApi('POST', '/search', token, {
    body: {
      query: input.query,
      filter: { property: 'object', value: 'page' },
      page_size: input.limit ?? 3,
    },
  })

  const pages = (response.results ?? []).map(mapPageSummary)
  return { found: pages.length > 0, pages }
}

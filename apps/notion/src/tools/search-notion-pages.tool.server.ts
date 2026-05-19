// src/tools/search-notion-pages.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import { notionApi, throwConnectionNotFound } from '../blocks/notion/shared/notion-api'
import { mapPageSummary, type MappedNotionPageSummary } from './shared/map-page'

interface SearchNotionPagesInput {
  query?: string
  limit?: number
  sortBy?: 'last_edited_time'
  sortOrder?: 'ascending' | 'descending'
}

interface SearchNotionPagesOutput {
  pages: Array<Omit<MappedNotionPageSummary, 'createdTime'>>
  truncated: boolean
}

export default async function searchNotionPages(
  input: SearchNotionPagesInput
): Promise<SearchNotionPagesOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const limit = input.limit ?? 10
  const body: Record<string, unknown> = {
    filter: { property: 'object', value: 'page' },
    page_size: limit,
    sort: {
      direction: input.sortOrder ?? 'descending',
      timestamp: input.sortBy ?? 'last_edited_time',
    },
  }
  if (input.query) body.query = input.query

  const response = await notionApi('POST', '/search', token, { body })
  const pages = (response.results ?? []).map((p: any) => {
    const summary = mapPageSummary(p)
    const { createdTime: _omit, ...rest } = summary
    return rest
  })

  return { pages, truncated: Boolean(response.has_more) }
}

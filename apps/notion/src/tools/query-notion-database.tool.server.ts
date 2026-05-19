// src/tools/query-notion-database.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import { BlockRuntimeError } from '@auxx/sdk/shared'
import {
  buildSimpleFilter,
  notionApi,
  notionPaginatedRequest,
  throwConnectionNotFound,
} from '../blocks/notion/shared/notion-api'
import { mapDatabaseRow, type MappedDatabaseRow } from './shared/map-database-row'

interface QueryNotionDatabaseInput {
  databaseId: string
  filter?: {
    propertyName: string
    condition: string
    value?: string
  }
  sort?: {
    propertyName?: string
    timestamp?: 'created_time' | 'last_edited_time'
    direction?: 'ascending' | 'descending'
  }
  limit?: number
}

interface QueryNotionDatabaseOutput {
  pages: MappedDatabaseRow[]
  truncated: boolean
}

export default async function queryNotionDatabase(
  input: QueryNotionDatabaseInput
): Promise<QueryNotionDatabaseOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  // Re-check the zod .refine() — the JSON-Schema converter strips it.
  if (input.sort && Boolean(input.sort.propertyName) === Boolean(input.sort.timestamp)) {
    throw new BlockRuntimeError(
      'sort must specify exactly one of propertyName or timestamp.',
      'INVALID_INPUT'
    )
  }

  const limit = Math.min(input.limit ?? 25, 100)
  const body: Record<string, unknown> = {}

  if (input.filter) {
    // Resolve the property type from the live schema (Notion filters are type-tagged).
    const dbResponse = await notionApi('GET', `/databases/${input.databaseId}`, token)
    const propType = dbResponse?.properties?.[input.filter.propertyName]?.type
    if (!propType) {
      throw new BlockRuntimeError(
        `Property "${input.filter.propertyName}" does not exist on the database.`,
        'INVALID_PROPERTY'
      )
    }
    body.filter = buildSimpleFilter(
      input.filter.propertyName,
      input.filter.condition,
      input.filter.value ?? '',
      propType
    )
  }

  if (input.sort) {
    const direction = input.sort.direction ?? 'ascending'
    body.sorts = [
      input.sort.timestamp
        ? { timestamp: input.sort.timestamp, direction }
        : { property: input.sort.propertyName, direction },
    ]
  }

  const { results, truncated } = await notionPaginatedRequest(
    'POST',
    `/databases/${input.databaseId}/query`,
    token,
    { body, returnAll: false, limit }
  )

  return {
    pages: results.map(mapDatabaseRow),
    truncated,
  }
}

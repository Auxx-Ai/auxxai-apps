// src/blocks/notion/resources/database/database-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { notionApi, notionPaginatedRequest, throwConnectionNotFound } from '../../shared/notion-api'

export async function executeDatabase(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'get':
      return getDatabase(token, input)
    case 'getMany':
      return getManyDatabases(token, input)
    case 'search':
      return searchDatabases(token, input)
    default:
      throw new Error(`Unknown database operation: ${operation}`)
  }
}

async function getDatabase(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const databaseId = input.getDatabaseId?.trim()
  if (!databaseId) {
    throw new BlockValidationError([{ field: 'getDatabaseId', message: 'Select a database.' }])
  }

  const result = await notionApi('GET', `/databases/${databaseId}`, token)

  const title = (result.title ?? []).map((t: any) => t.plain_text).join('')

  return {
    databaseId: result.id ?? '',
    title,
    url: result.url ?? '',
    properties: result.properties ?? {},
  }
}

async function getManyDatabases(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const returnAll = input.getManyDbReturnAll === true || input.getManyDbReturnAll === 'true'
  const limit = returnAll ? undefined : Number(input.getManyDbLimit) || 100

  const { results } = await notionPaginatedRequest('POST', '/search', token, {
    body: { filter: { property: 'object', value: 'database' } },
    returnAll,
    limit,
  })

  const databases = results.map((db: any) => ({
    id: db.id,
    title: (db.title ?? []).map((t: any) => t.plain_text).join(''),
    url: db.url,
  }))

  return {
    databases: databases,
    totalCount: String(databases.length),
  }
}

async function searchDatabases(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const returnAll = input.searchDbReturnAll === true || input.searchDbReturnAll === 'true'
  const limit = returnAll ? undefined : Number(input.searchDbLimit) || 100

  const body: Record<string, unknown> = {
    filter: { property: 'object', value: 'database' },
  }

  const query = input.searchDbText?.trim()
  if (query) body.query = query

  const sortDirection = input.searchDbSortDirection ?? 'descending'
  body.sort = { direction: sortDirection, timestamp: 'last_edited_time' }

  const { results, truncated } = await notionPaginatedRequest('POST', '/search', token, {
    body,
    returnAll,
    limit,
  })

  const databases = results.map((db: any) => ({
    id: db.id,
    title: (db.title ?? []).map((t: any) => t.plain_text).join(''),
    url: db.url,
  }))

  return {
    databases: databases,
    totalCount: String(databases.length),
    truncated: String(truncated),
  }
}

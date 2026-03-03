// src/blocks/notion/resources/database-page/database-page-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import {
  notionApi,
  notionPaginatedRequest,
  throwConnectionNotFound,
  toNotionProperties,
  textToParagraphBlock,
  buildSimpleFilter,
} from '../../shared/notion-api'
import { getDatabaseSchema } from '../../shared/list-database-properties.server'

export async function executeDatabasePage(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'create':
      return createDatabasePage(token, input)
    case 'get':
      return getDatabasePage(token, input)
    case 'getMany':
      return getManyDatabasePages(token, input)
    case 'update':
      return updateDatabasePage(token, input)
    default:
      throw new Error(`Unknown databasePage operation: ${operation}`)
  }
}

async function createDatabasePage(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const databaseId = input.createDatabaseId?.trim()
  if (!databaseId) {
    throw new BlockValidationError([{ field: 'createDatabaseId', message: 'Select a database.' }])
  }

  // Fetch database schema to identify title property and format properties
  const schema = await getDatabaseSchema(token, databaseId)

  // Find the title property key
  const titlePropertyKey = Object.entries(schema).find(([, v]) => v.type === 'title')?.[0]

  // Build properties
  const properties: Record<string, any> = {}

  // Set title if provided
  const title = input.createTitle?.trim()
  if (title && titlePropertyKey) {
    properties[titlePropertyKey] = { title: [{ text: { content: title } }] }
  }

  // Add additional properties from key-value pairs
  const kvPairs = input.createProperties
  if (Array.isArray(kvPairs) && kvPairs.length > 0) {
    const extraProps = toNotionProperties(kvPairs, schema)
    Object.assign(properties, extraProps)
  }

  // Build children (optional content)
  const children: any[] = []
  const content = input.createContent?.trim()
  if (content) {
    children.push(textToParagraphBlock(content))
  }

  const body: Record<string, unknown> = {
    parent: { database_id: databaseId },
    properties,
    ...(children.length > 0 ? { children } : {}),
  }

  const result = await notionApi('POST', '/pages', token, { body })

  return {
    pageId: result.id ?? '',
    url: result.url ?? '',
    createdTime: result.created_time ?? '',
    properties: result.properties ?? {},
  }
}

async function getDatabasePage(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const pageId = input.getPageId?.trim()
  if (!pageId) {
    throw new BlockValidationError([{ field: 'getPageId', message: 'Page ID is required.' }])
  }

  const result = await notionApi('GET', `/pages/${pageId}`, token)

  return {
    pageId: result.id ?? '',
    url: result.url ?? '',
    createdTime: result.created_time ?? '',
    lastEditedTime: result.last_edited_time ?? '',
    properties: result.properties ?? {},
  }
}

async function getManyDatabasePages(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const databaseId = input.getManyDatabaseId?.trim()
  if (!databaseId) {
    throw new BlockValidationError([{ field: 'getManyDatabaseId', message: 'Select a database.' }])
  }

  const returnAll = input.getManyReturnAll === true || input.getManyReturnAll === 'true'
  const limit = returnAll ? undefined : Number(input.getManyLimit) || 100

  // Build request body
  const body: Record<string, unknown> = {}

  // Build filter
  const filterType = input.getManyFilterType ?? 'none'
  if (filterType === 'simple') {
    const property = input.getManyFilterProperty?.trim()
    const condition = input.getManyFilterCondition?.trim()
    if (property && condition) {
      // Fetch schema to determine property type
      const schema = await getDatabaseSchema(token, databaseId)
      const propType = schema[property]?.type ?? 'rich_text'
      const value = input.getManyFilterValue ?? ''
      body.filter = buildSimpleFilter(property, condition, value, propType)
    }
  } else if (filterType === 'json') {
    const filterJson = input.getManyFilterJson?.trim()
    if (filterJson) {
      try {
        body.filter = JSON.parse(filterJson)
      } catch {
        throw new BlockValidationError([
          {
            field: 'getManyFilterJson',
            message: 'Filter JSON must be a valid JSON object.',
          },
        ])
      }
    }
  }

  // Build sort
  const sorts: any[] = []
  const sortTimestamp = input.getManySortTimestamp?.trim()
  if (sortTimestamp) {
    sorts.push({
      timestamp: sortTimestamp,
      direction: input.getManySortDirection ?? 'ascending',
    })
  } else {
    const sortProperty = input.getManySortProperty?.trim()
    if (sortProperty) {
      sorts.push({
        property: sortProperty,
        direction: input.getManySortDirection ?? 'ascending',
      })
    }
  }
  if (sorts.length > 0) body.sorts = sorts

  const { results, truncated } = await notionPaginatedRequest(
    'POST',
    `/databases/${databaseId}/query`,
    token,
    { body, returnAll, limit }
  )

  return {
    pages: results,
    totalCount: String(results.length),
    truncated: String(truncated),
  }
}

async function updateDatabasePage(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const pageId = input.updatePageId?.trim()
  if (!pageId) {
    throw new BlockValidationError([{ field: 'updatePageId', message: 'Page ID is required.' }])
  }

  const databaseId = input.updateDatabaseId?.trim()
  const kvPairs = input.updateProperties
  if (!Array.isArray(kvPairs) || kvPairs.length === 0) {
    throw new BlockValidationError([
      { field: 'updateProperties', message: 'At least one property is required.' },
    ])
  }

  // Fetch schema if database is selected
  let schema: Record<string, { type: string }> = {}
  if (databaseId) {
    schema = await getDatabaseSchema(token, databaseId)
  }

  const properties = toNotionProperties(kvPairs, schema)

  const result = await notionApi('PATCH', `/pages/${pageId}`, token, {
    body: { properties },
  })

  return {
    pageId: result.id ?? '',
    url: result.url ?? '',
    lastEditedTime: result.last_edited_time ?? '',
    properties: result.properties ?? {},
  }
}

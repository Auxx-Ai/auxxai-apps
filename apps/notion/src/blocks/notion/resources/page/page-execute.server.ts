// src/blocks/notion/resources/page/page-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import {
  notionApi,
  notionPaginatedRequest,
  throwConnectionNotFound,
  textToParagraphBlock,
} from '../../shared/notion-api'

export async function executePage(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'archive':
      return archivePage(token, input)
    case 'create':
      return createPage(token, input)
    case 'search':
      return searchPages(token, input)
    default:
      throw new Error(`Unknown page operation: ${operation}`)
  }
}

async function archivePage(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const pageId = input.archivePageId?.trim()
  if (!pageId) {
    throw new BlockValidationError([{ field: 'archivePageId', message: 'Page ID is required.' }])
  }

  const result = await notionApi('PATCH', `/pages/${pageId}`, token, {
    body: { archived: true },
  })

  return {
    pageId: result.id ?? '',
    archived: String(result.archived ?? true),
  }
}

async function createPage(token: string, input: Record<string, any>): Promise<Record<string, any>> {
  const parentId = input.createPageParentId?.trim()
  if (!parentId) {
    throw new BlockValidationError([
      { field: 'createPageParentId', message: 'Parent page ID is required.' },
    ])
  }

  const title = input.createPageTitle?.trim()
  if (!title) {
    throw new BlockValidationError([{ field: 'createPageTitle', message: 'Title is required.' }])
  }

  const body: Record<string, unknown> = {
    parent: { page_id: parentId },
    properties: {
      title: { title: [{ text: { content: title } }] },
    },
  }

  // Optional content
  const content = input.createPageContent?.trim()
  if (content) {
    body.children = [textToParagraphBlock(content)]
  }

  // Optional icon emoji
  const icon = input.createPageIcon?.trim()
  if (icon) {
    body.icon = { type: 'emoji', emoji: icon }
  }

  const result = await notionApi('POST', '/pages', token, { body })

  return {
    pageId: result.id ?? '',
    url: result.url ?? '',
    createdTime: result.created_time ?? '',
  }
}

async function searchPages(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const returnAll = input.searchReturnAll === true || input.searchReturnAll === 'true'
  const limit = returnAll ? undefined : Number(input.searchLimit) || 100

  const body: Record<string, unknown> = {}

  const query = input.searchText?.trim()
  if (query) body.query = query

  const filterObject = input.searchFilterObject?.trim()
  if (filterObject) {
    body.filter = { property: 'object', value: filterObject }
  }

  const sortDirection = input.searchSortDirection ?? 'descending'
  body.sort = { direction: sortDirection, timestamp: 'last_edited_time' }

  const { results, truncated } = await notionPaginatedRequest('POST', '/search', token, {
    body,
    returnAll,
    limit,
  })

  return {
    results: results,
    totalCount: String(results.length),
    truncated: String(truncated),
  }
}

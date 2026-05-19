// src/tools/get-notion-page-content.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import { notionPaginatedRequest, throwConnectionNotFound } from '../blocks/notion/shared/notion-api'
import { blocksToText } from './shared/blocks-to-text'

interface GetNotionPageContentInput {
  pageId: string
  limit?: number
}

interface GetNotionPageContentOutput {
  content: string
  blockCount: number
  truncated: boolean
}

export default async function getNotionPageContent(
  input: GetNotionPageContentInput
): Promise<GetNotionPageContentOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const limit = Math.min(input.limit ?? 50, 100)
  const { results, truncated } = await notionPaginatedRequest(
    'GET',
    `/blocks/${input.pageId}/children`,
    token,
    { returnAll: false, limit }
  )

  return {
    content: blocksToText(results),
    blockCount: results.length,
    truncated,
  }
}

// src/tools/get-notion-page.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import { notionApi, throwConnectionNotFound } from '../blocks/notion/shared/notion-api'
import { mapPage, type MappedNotionPage } from './shared/map-page'

interface GetNotionPageInput {
  pageId: string
}

export default async function getNotionPage(input: GetNotionPageInput): Promise<MappedNotionPage> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()

  const result = await notionApi('GET', `/pages/${input.pageId}`, connection.value)
  return mapPage(result)
}

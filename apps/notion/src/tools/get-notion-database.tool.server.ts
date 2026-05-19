// src/tools/get-notion-database.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import { notionApi, throwConnectionNotFound } from '../blocks/notion/shared/notion-api'
import { mapDatabase, type MappedNotionDatabase } from './shared/map-database'

interface GetNotionDatabaseInput {
  databaseId: string
}

export default async function getNotionDatabase(
  input: GetNotionDatabaseInput
): Promise<MappedNotionDatabase> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()

  const result = await notionApi('GET', `/databases/${input.databaseId}`, connection.value)
  return mapDatabase(result)
}

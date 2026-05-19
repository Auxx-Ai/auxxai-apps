// src/tools/create-notion-database-page.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import { BlockRuntimeError } from '@auxx/sdk/shared'
import {
  notionApi,
  textToParagraphBlock,
  throwConnectionNotFound,
} from '../blocks/notion/shared/notion-api'
import { mapDatabase } from './shared/map-database'
import { buildNotionProperties, type TypedPropertyEntry } from './shared/properties-to-notion'

interface CreateNotionDatabasePageInput {
  databaseId: string
  properties: TypedPropertyEntry[]
  content?: string
  icon?: string
}

interface CreateNotionDatabasePageOutput {
  pageId: string
  url: string
  createdTime: string
}

export default async function createNotionDatabasePage(
  input: CreateNotionDatabasePageInput
): Promise<CreateNotionDatabasePageOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  if (!Array.isArray(input.properties) || input.properties.length === 0) {
    throw new BlockRuntimeError(
      'properties must contain at least one entry (including the title property).',
      'INVALID_INPUT'
    )
  }

  // Fetch the database schema and re-validate properties against it (option
  // names, writability, type match). The discriminator handles raw-type
  // mismatches at parse time; this layer needs the live schema.
  const dbResponse = await notionApi('GET', `/databases/${input.databaseId}`, token)
  const mapped = mapDatabase(dbResponse)
  const schemaByName: Record<
    string,
    { type: string; options: string[] | null; writable: boolean }
  > = {}
  for (const p of mapped.properties) {
    schemaByName[p.name] = { type: p.type, options: p.options, writable: p.writable }
  }

  const properties = buildNotionProperties(input.properties, schemaByName)

  const body: Record<string, unknown> = {
    parent: { database_id: input.databaseId },
    properties,
  }
  if (input.content) {
    body.children = [textToParagraphBlock(input.content)]
  }
  if (input.icon) {
    body.icon = { type: 'emoji', emoji: input.icon }
  }

  const result = await notionApi('POST', '/pages', token, { body })

  return {
    pageId: result.id ?? '',
    url: result.url ?? '',
    createdTime: result.created_time ?? '',
  }
}

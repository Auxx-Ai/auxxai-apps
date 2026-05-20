// src/tools/internal/notion-block-search-databases.tool.server.ts

import { executeDatabase } from '../../blocks/notion/resources/database/database-execute.server'

export default async function notionBlockSearchDatabases(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDatabase('search', input)
}

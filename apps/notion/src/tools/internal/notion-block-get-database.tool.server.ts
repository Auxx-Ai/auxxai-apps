// src/tools/internal/notion-block-get-database.tool.server.ts

import { executeDatabase } from '../../blocks/notion/resources/database/database-execute.server'

export default async function notionBlockGetDatabase(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDatabase('get', input)
}

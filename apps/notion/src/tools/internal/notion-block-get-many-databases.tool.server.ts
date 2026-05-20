// src/tools/internal/notion-block-get-many-databases.tool.server.ts

import { executeDatabase } from '../../blocks/notion/resources/database/database-execute.server'

export default async function notionBlockGetManyDatabases(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDatabase('getMany', input)
}

// src/tools/internal/notion-block-get-database-page.tool.server.ts

import { executeDatabasePage } from '../../blocks/notion/resources/database-page/database-page-execute.server'

export default async function notionBlockGetDatabasePage(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDatabasePage('get', input)
}

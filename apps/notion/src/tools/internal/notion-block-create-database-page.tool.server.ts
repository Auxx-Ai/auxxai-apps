// src/tools/internal/notion-block-create-database-page.tool.server.ts

import { executeDatabasePage } from '../../blocks/notion/resources/database-page/database-page-execute.server'

export default async function notionBlockCreateDatabasePage(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDatabasePage('create', input)
}

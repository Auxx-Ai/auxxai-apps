// src/tools/internal/notion-block-archive-page.tool.server.ts

import { executePage } from '../../blocks/notion/resources/page/page-execute.server'

export default async function notionBlockArchivePage(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executePage('archive', input)
}

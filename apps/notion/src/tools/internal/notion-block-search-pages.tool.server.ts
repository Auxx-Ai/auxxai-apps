// src/tools/internal/notion-block-search-pages.tool.server.ts

import { executePage } from '../../blocks/notion/resources/page/page-execute.server'

export default async function notionBlockSearchPages(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executePage('search', input)
}

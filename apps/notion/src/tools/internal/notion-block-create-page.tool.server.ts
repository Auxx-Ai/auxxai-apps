// src/tools/internal/notion-block-create-page.tool.server.ts

import { executePage } from '../../blocks/notion/resources/page/page-execute.server'

export default async function notionBlockCreatePage(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executePage('create', input)
}

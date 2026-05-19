// src/tools/create-notion-page.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import {
  notionApi,
  textToParagraphBlock,
  throwConnectionNotFound,
} from '../blocks/notion/shared/notion-api'

interface CreateNotionPageInput {
  parentPageId: string
  title: string
  content?: string
  icon?: string
}

interface CreateNotionPageOutput {
  pageId: string
  url: string
  createdTime: string
}

export default async function createNotionPage(
  input: CreateNotionPageInput
): Promise<CreateNotionPageOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const body: Record<string, unknown> = {
    parent: { page_id: input.parentPageId },
    properties: {
      title: { title: [{ text: { content: input.title } }] },
    },
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

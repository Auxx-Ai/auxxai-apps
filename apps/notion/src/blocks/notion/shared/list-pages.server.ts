// src/blocks/notion/shared/list-pages.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { notionApi, throwConnectionNotFound } from './notion-api'

/**
 * Search pages accessible to the integration.
 * Used for page selector dropdowns if needed.
 */
export default async function listPages(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const pages: { label: string; value: string }[] = []
  let cursor: string | undefined

  do {
    const body: Record<string, unknown> = {
      filter: { property: 'object', value: 'page' },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    }

    const response = await notionApi('POST', '/search', token, { body })

    for (const page of response.results ?? []) {
      const titleProp = Object.values(page.properties ?? {}).find(
        (p: any) => p.type === 'title',
      ) as any
      const title =
        titleProp?.title?.map((t: any) => t.plain_text).join('') ||
        page.id
      pages.push({
        label: title,
        value: page.id,
      })
    }

    cursor = response.has_more ? response.next_cursor : undefined
  } while (cursor)

  return pages.sort((a, b) => a.label.localeCompare(b.label))
}

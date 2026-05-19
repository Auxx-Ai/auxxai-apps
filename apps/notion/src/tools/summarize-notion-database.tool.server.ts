// src/tools/summarize-notion-database.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import {
  buildSimpleFilter,
  notionApi,
  notionPaginatedRequest,
  throwConnectionNotFound,
} from '../blocks/notion/shared/notion-api'
import { blocksToText } from './shared/blocks-to-text'
import { mapDatabaseRow } from './shared/map-database-row'

interface SummarizeNotionDatabaseInput {
  databaseId: string
  filter?: { propertyName: string; condition: string; value?: string }
  limit?: number
  includeBlocks?: boolean
}

interface PageSummary {
  pageId: string
  title: string
  url: string
  propertiesPreview: string
  contentPreview: string
}

interface SummarizeNotionDatabaseOutput {
  summary: string
  pages: PageSummary[]
  truncated: boolean
}

/**
 * Streaming tool. Mirrors Discord's summarize_recent_discord_activity and
 * Shopify's summarize_recent_orders. See plans/kopilot/apps/notion-overhaul.md
 * §4.10, §7.
 */
export default async function* summarizeNotionDatabase(
  input: SummarizeNotionDatabaseInput
): AsyncGenerator<{ kind: string; data: unknown }, SummarizeNotionDatabaseOutput, void> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const limit = Math.min(input.limit ?? 10, 25)
  const includeBlocks = input.includeBlocks !== false

  yield { kind: 'phase', data: { phase: 'starting' } }

  // 1. Resolve filter against the live schema (we need the property type for
  // Notion's typed filters).
  const body: Record<string, unknown> = {}
  if (input.filter) {
    const dbResponse = await notionApi('GET', `/databases/${input.databaseId}`, token)
    const propType = dbResponse?.properties?.[input.filter.propertyName]?.type
    if (propType) {
      body.filter = buildSimpleFilter(
        input.filter.propertyName,
        input.filter.condition,
        input.filter.value ?? '',
        propType
      )
    }
  }

  // 2. Query the database.
  const { results, truncated } = await notionPaginatedRequest(
    'POST',
    `/databases/${input.databaseId}/query`,
    token,
    { body, returnAll: false, limit }
  )

  const rows = results.map(mapDatabaseRow)
  yield { kind: 'phase', data: { phase: 'found', total: rows.length } }

  // 3. Per-row fan-out: fetch blocks for each page (when enabled), build the
  // per-page preview.
  const pages: PageSummary[] = []
  let totalContentChars = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    yield {
      kind: 'phase',
      data: { phase: 'fetching', idx: i + 1, total: rows.length, pageTitle: row.title },
    }

    let contentPreview = ''
    if (includeBlocks) {
      try {
        const { results: blocks } = await notionPaginatedRequest(
          'GET',
          `/blocks/${row.pageId}/children`,
          token,
          { returnAll: false, limit: 50 }
        )
        const text = blocksToText(blocks)
        contentPreview = text.length > 500 ? `${text.slice(0, 500)}…` : text
        totalContentChars += text.length
      } catch (err) {
        yield {
          kind: 'phase',
          data: {
            phase: 'page-error',
            pageTitle: row.title,
            message: err instanceof Error ? err.message : String(err),
          },
        }
      }
    }

    const propertiesPreview = row.properties
      .filter((p) => p.value && p.name !== row.title)
      .slice(0, 4)
      .map((p) => `${p.name}: ${p.value}`)
      .join(' · ')

    pages.push({
      pageId: row.pageId,
      title: row.title,
      url: row.url,
      propertiesPreview,
      contentPreview,
    })

    yield {
      kind: 'phase',
      data: {
        phase: 'fetched',
        idx: i + 1,
        total: rows.length,
        pageTitle: row.title,
      },
    }
  }

  return {
    summary: buildSummary(pages, totalContentChars, includeBlocks, truncated),
    pages,
    truncated,
  }
}

function buildSummary(
  pages: PageSummary[],
  totalContentChars: number,
  includeBlocks: boolean,
  truncated: boolean
): string {
  if (pages.length === 0) {
    return 'No pages matched the query.'
  }

  const lines = [
    `${pages.length} page${pages.length === 1 ? '' : 's'}${truncated ? ' (more available)' : ''}.`,
  ]
  if (includeBlocks && totalContentChars > 0) {
    lines.push(`Aggregated content: ~${totalContentChars} chars across pages.`)
  }
  const sample = pages
    .slice(0, 5)
    .map(
      (p) => `• ${p.title || '(untitled)'}${p.propertiesPreview ? ` — ${p.propertiesPreview}` : ''}`
    )
    .join('\n')
  if (sample) lines.push(sample)
  return lines.join('\n')
}

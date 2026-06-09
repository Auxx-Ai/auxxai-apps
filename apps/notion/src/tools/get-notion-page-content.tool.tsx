// src/tools/get-notion-page-content.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import getNotionPageContentExecute from './get-notion-page-content.tool.server'

export const getNotionPageContentTool = defineTool({
  id: 'get_notion_page_content',
  name: 'Get Notion page content',
  description:
    "Fetch a Notion page's content as flat markdown-flavored text. Hides Notion's nested block tree behind a single string. Use this whenever you need to read a page's body.",
  icon: notionIcon,
  inputs: z.object({
    pageId: z.string().describe('Page id (or block id — Notion treats pages as blocks).'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'Max top-level blocks to fetch. Default 50. Nested children are not recursed in v1.'
      ),
  }),
  outputs: z.object({
    content: z
      .string()
      .describe(
        'Flattened plain-text content. Headings prefixed with #/##/###, list items with -/1., to-dos with [ ]/[x], code blocks fenced with backticks. Read-only — to edit content, use append_notion_blocks.'
      ),
    blockCount: z.number().int(),
    truncated: z.boolean().describe('True if more top-level blocks exist beyond the limit.'),
  }),
  exampleOutput: {
    content:
      '# Q3 Product Roadmap\n\nOur focus for this quarter is reliability and onboarding.\n\n## Goals\n- Ship the new onboarding flow\n- Reduce p95 latency below 200ms\n\n[ ] Draft launch announcement\n[x] Finalize pricing tiers',
    blockCount: 7,
    truncated: false,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: getNotionPageContentExecute,
  agent: { toolsetSlug: 'notion.blocks' },
})

// src/tools/append-notion-blocks.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import appendNotionBlocksExecute from './append-notion-blocks.tool.server'

export const appendNotionBlocksTool = defineTool({
  id: 'append_notion_blocks',
  name: 'Append blocks to Notion page',
  description:
    'Append content blocks to an existing Notion page. Additive write — appends after existing content. Use after create_notion_page or create_notion_database_page when you need richer multi-block content.',
  icon: notionIcon,
  inputs: z.object({
    parentId: z.string().describe('Page or block id to append children to.'),
    blocks: z
      .array(
        z.discriminatedUnion('type', [
          z.object({ type: z.literal('paragraph'), text: z.string() }),
          z.object({ type: z.literal('heading_1'), text: z.string() }),
          z.object({ type: z.literal('heading_2'), text: z.string() }),
          z.object({ type: z.literal('heading_3'), text: z.string() }),
          z.object({ type: z.literal('bulleted_list_item'), text: z.string() }),
          z.object({ type: z.literal('numbered_list_item'), text: z.string() }),
          z.object({
            type: z.literal('to_do'),
            text: z.string(),
            checked: z.boolean().optional(),
          }),
          z.object({ type: z.literal('toggle'), text: z.string() }),
          z.object({ type: z.literal('quote'), text: z.string() }),
          z.object({
            type: z.literal('callout'),
            text: z.string(),
            icon: z.string().optional(),
          }),
          z.object({ type: z.literal('divider') }),
          z.object({
            type: z.literal('code'),
            text: z.string(),
            language: z.string().optional().describe('Default plain text.'),
          }),
        ])
      )
      .min(1)
      .max(100)
      .describe('Blocks to append. Order preserved.'),
  }),
  outputs: z.object({
    blockIds: z.array(z.string()),
    blockCount: z.number().int(),
  }),
  exampleOutput: {
    blockIds: [
      '8091a2b3-c4d5-e6f7-0819-203040506070',
      '91a2b3c4-d5e6-f708-1920-304050607080',
    ],
    blockCount: 2,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: appendNotionBlocksExecute,
  agent: { toolsetSlug: 'notion.blocks' },
})

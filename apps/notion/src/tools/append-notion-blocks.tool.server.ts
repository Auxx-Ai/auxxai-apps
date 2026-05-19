// src/tools/append-notion-blocks.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import { BlockRuntimeError } from '@auxx/sdk/shared'
import { notionApi, throwConnectionNotFound } from '../blocks/notion/shared/notion-api'

type BlockInput =
  | { type: 'paragraph'; text: string }
  | { type: 'heading_1'; text: string }
  | { type: 'heading_2'; text: string }
  | { type: 'heading_3'; text: string }
  | { type: 'bulleted_list_item'; text: string }
  | { type: 'numbered_list_item'; text: string }
  | { type: 'to_do'; text: string; checked?: boolean }
  | { type: 'toggle'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'callout'; text: string; icon?: string }
  | { type: 'divider' }
  | { type: 'code'; text: string; language?: string }

interface AppendNotionBlocksInput {
  parentId: string
  blocks: BlockInput[]
}

interface AppendNotionBlocksOutput {
  blockIds: string[]
  blockCount: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNotionBlock(block: BlockInput): any {
  if (block.type === 'divider') {
    return { object: 'block', type: 'divider', divider: {} }
  }
  if (block.type === 'to_do') {
    return {
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ type: 'text', text: { content: block.text } }],
        checked: Boolean(block.checked),
      },
    }
  }
  if (block.type === 'code') {
    return {
      object: 'block',
      type: 'code',
      code: {
        rich_text: [{ type: 'text', text: { content: block.text } }],
        language: block.language ?? 'plain text',
      },
    }
  }
  if (block.type === 'callout') {
    return {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{ type: 'text', text: { content: block.text } }],
        ...(block.icon ? { icon: { type: 'emoji', emoji: block.icon } } : {}),
      },
    }
  }
  return {
    object: 'block',
    type: block.type,
    [block.type]: {
      rich_text: [{ type: 'text', text: { content: block.text } }],
    },
  }
}

export default async function appendNotionBlocks(
  input: AppendNotionBlocksInput
): Promise<AppendNotionBlocksOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  if (!Array.isArray(input.blocks) || input.blocks.length === 0) {
    throw new BlockRuntimeError('blocks must contain at least one entry.', 'INVALID_INPUT')
  }

  const children = input.blocks.map(toNotionBlock)
  const result = await notionApi('PATCH', `/blocks/${input.parentId}/children`, token, {
    body: { children },
  })

  const blockIds = (result.results ?? []).map((b: any) => b.id ?? '')
  return { blockIds, blockCount: blockIds.length }
}

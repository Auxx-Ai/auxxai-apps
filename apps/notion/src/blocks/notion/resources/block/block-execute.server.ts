// src/blocks/notion/resources/block/block-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { notionApi, notionPaginatedRequest, throwConnectionNotFound } from '../../shared/notion-api'

export async function executeBlock(
  operation: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'append':
      return appendBlocks(token, input)
    case 'getChildren':
      return getBlockChildren(token, input)
    default:
      throw new Error(`Unknown block operation: ${operation}`)
  }
}

/**
 * Convert a block item to Notion's block format.
 */
function toNotionBlock(item: {
  blockType: string
  content?: string
  checked?: boolean | string
  language?: string
}): any {
  const { blockType, content = '', checked, language } = item

  // Divider has no content
  if (blockType === 'divider') {
    return { object: 'block', type: 'divider', divider: {} }
  }

  const richText = [{ type: 'text', text: { content } }]

  // To-do has a checked field
  if (blockType === 'to_do') {
    return {
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: richText,
        checked: checked === true || checked === 'true',
      },
    }
  }

  // Code has a language field
  if (blockType === 'code') {
    return {
      object: 'block',
      type: 'code',
      code: {
        rich_text: richText,
        language: language ?? 'plain text',
      },
    }
  }

  // All other block types follow the same pattern
  return {
    object: 'block',
    type: blockType,
    [blockType]: {
      rich_text: richText,
    },
  }
}

async function appendBlocks(
  token: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const blockId = input.appendBlockId?.trim()
  if (!blockId) {
    throw new BlockValidationError([
      { field: 'appendBlockId', message: 'Block/Page ID is required.' },
    ])
  }

  const blocks = input.appendBlocks
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new BlockValidationError([
      { field: 'appendBlocks', message: 'At least one block is required.' },
    ])
  }

  const children = blocks.map(toNotionBlock)

  const result = await notionApi('PATCH', `/blocks/${blockId}/children`, token, {
    body: { children },
  })

  const blockIds = (result.results ?? []).map((b: any) => b.id)

  return {
    blockIds: JSON.stringify(blockIds),
    blockCount: String(blockIds.length),
  }
}

async function getBlockChildren(
  token: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const blockId = input.getChildrenBlockId?.trim()
  if (!blockId) {
    throw new BlockValidationError([
      { field: 'getChildrenBlockId', message: 'Block/Page ID is required.' },
    ])
  }

  const returnAll =
    input.getChildrenReturnAll === true || input.getChildrenReturnAll === 'true'
  const limit = returnAll ? undefined : Number(input.getChildrenLimit) || 100

  const { results, truncated } = await notionPaginatedRequest(
    'GET',
    `/blocks/${blockId}/children`,
    token,
    { returnAll, limit },
  )

  return {
    blocks: JSON.stringify(results),
    totalCount: String(results.length),
    truncated: String(truncated),
  }
}

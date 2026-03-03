// src/blocks/notion/resources/block/block-schema.ts

/**
 * Block resource input/output field definitions.
 * Operations: Append, Get Children
 */

import { Workflow } from '@auxx/sdk'
import { BLOCK_TYPES, CODE_LANGUAGES } from '../constants'

export const blockInputs = {
  // --- Block: Append ---
  appendBlockId: Workflow.string({
    label: 'Block/Page ID',
    description: 'The parent block or page ID to append children to',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    acceptsVariables: true,
  }),
  appendBlocks: Workflow.array({
    label: 'Blocks',
    description: 'Blocks to append',
    items: Workflow.struct({
      blockType: Workflow.select({
        label: 'Type',
        options: BLOCK_TYPES as any,
        default: 'paragraph',
      }),
      content: Workflow.string({
        label: 'Content',
        description: 'Text content of the block',
        acceptsVariables: true,
      }),
      checked: Workflow.boolean({
        label: 'Checked',
        description: 'For to-do blocks: whether the checkbox is checked',
        default: false,
      }),
      language: Workflow.select({
        label: 'Language',
        description: 'For code blocks: programming language',
        options: CODE_LANGUAGES as any,
        default: 'plain text',
      }),
    }),
  }),

  // --- Block: Get Children ---
  getChildrenBlockId: Workflow.string({
    label: 'Block/Page ID',
    description: 'The parent block or page ID to get children from',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    acceptsVariables: true,
  }),
  getChildrenReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Paginate through all results',
    default: false,
  }),
  getChildrenLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of blocks to return (1-100)',
    default: 100,
    min: 1,
    max: 100,
  }),
}

export function blockComputeOutputs(operation: string) {
  if (operation === 'append') {
    return {
      blockIds: Workflow.array({ label: 'Block IDs', items: Workflow.string() }),
      blockCount: Workflow.string({ label: 'Block Count' }),
    }
  }
  if (operation === 'getChildren') {
    return {
      blocks: Workflow.array({
        label: 'Blocks',
        items: Workflow.struct({
          id: Workflow.string({ label: 'ID' }),
          type: Workflow.string({ label: 'Type' }),
        }),
      }),
      totalCount: Workflow.string({ label: 'Total Count' }),
      truncated: Workflow.string({ label: 'Truncated' }),
    }
  }
  return {}
}

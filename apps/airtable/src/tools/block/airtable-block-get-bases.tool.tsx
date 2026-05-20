// src/tools/block/airtable-block-get-bases.tool.tsx

/**
 * Internal tool backing the Airtable block's `base.getMany` op.
 * Surface-less (no agent, no action) — invocable only via the block dispatcher.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import airtableIcon from '../../assets/icon.png'
import airtableBlockGetBasesExecute from './airtable-block-get-bases.tool.server'

export const airtableBlockGetBasesTool = defineTool({
  id: 'airtable_block_get_bases',
  name: 'Airtable: get bases (block)',
  description: 'Internal: returns Airtable bases for the Airtable block.',
  icon: airtableIcon,
  inputs: z.object({
    returnAll: z.boolean().optional(),
    limit: z.number().optional(),
  }),
  outputs: z.object({
    bases: z.array(z.unknown()),
    totalCount: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: airtableBlockGetBasesExecute,
})

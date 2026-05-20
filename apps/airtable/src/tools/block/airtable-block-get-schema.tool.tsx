// src/tools/block/airtable-block-get-schema.tool.tsx

/**
 * Internal tool backing the Airtable block's `base.getSchema` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import airtableIcon from '../../assets/icon.png'
import airtableBlockGetSchemaExecute from './airtable-block-get-schema.tool.server'

export const airtableBlockGetSchemaTool = defineTool({
  id: 'airtable_block_get_schema',
  name: 'Airtable: get base schema (block)',
  description: 'Internal: returns table schema for the Airtable block.',
  icon: airtableIcon,
  inputs: z.object({
    baseId: z.string(),
  }),
  outputs: z.object({
    tables: z.array(z.unknown()),
    tableCount: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: airtableBlockGetSchemaExecute,
})

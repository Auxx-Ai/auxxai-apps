// src/tools/block/airtable-block-get-record.tool.tsx

/**
 * Internal tool backing the Airtable block's `record.get` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import airtableIcon from '../../assets/icon.png'
import airtableBlockGetRecordExecute from './airtable-block-get-record.tool.server'

export const airtableBlockGetRecordTool = defineTool({
  id: 'airtable_block_get_record',
  name: 'Airtable: get record (block)',
  description: 'Internal: get record for the Airtable block.',
  icon: airtableIcon,
  inputs: z.object({
    baseId: z.string(),
    tableId: z.string(),
    recordId: z.string(),
  }),
  outputs: z.object({
    recordId: z.string(),
    createdTime: z.string(),
    fields: z.record(z.string(), z.unknown()),
  }),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: airtableBlockGetRecordExecute,
})

// src/tools/block/airtable-block-update-record.tool.tsx

/**
 * Internal tool backing the Airtable block's `record.update` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import airtableIcon from '../../assets/icon.png'
import airtableBlockUpdateRecordExecute from './airtable-block-update-record.tool.server'

export const airtableBlockUpdateRecordTool = defineTool({
  id: 'airtable_block_update_record',
  name: 'Airtable: update record (block)',
  description: 'Internal: update record for the Airtable block.',
  icon: airtableIcon,
  inputs: z.object({
    baseId: z.string(),
    tableId: z.string(),
    recordId: z.string(),
    fields: z.string(),
    typecast: z.union([z.boolean(), z.string()]).optional(),
  }),
  outputs: z.object({
    recordId: z.string(),
    fields: z.record(z.string(), z.unknown()),
  }),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: airtableBlockUpdateRecordExecute,
})

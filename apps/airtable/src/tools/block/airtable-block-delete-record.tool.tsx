// src/tools/block/airtable-block-delete-record.tool.tsx

/**
 * Internal tool backing the Airtable block's `record.delete` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import airtableIcon from '../../assets/icon.png'
import airtableBlockDeleteRecordExecute from './airtable-block-delete-record.tool.server'

export const airtableBlockDeleteRecordTool = defineTool({
  id: 'airtable_block_delete_record',
  name: 'Airtable: delete record (block)',
  description: 'Internal: delete record for the Airtable block.',
  icon: airtableIcon,
  inputs: z.object({
    baseId: z.string(),
    tableId: z.string(),
    recordId: z.string(),
  }),
  outputs: z.object({
    deletedRecordId: z.string(),
    deleted: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: airtableBlockDeleteRecordExecute,
})

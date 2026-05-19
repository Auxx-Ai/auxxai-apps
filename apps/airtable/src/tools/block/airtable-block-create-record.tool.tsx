// src/tools/block/airtable-block-create-record.tool.tsx

/**
 * Internal tool backing the Airtable block's `record.create` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import airtableIcon from '../../assets/icon.png'
import airtableBlockCreateRecordExecute from './airtable-block-create-record.tool.server'

export const airtableBlockCreateRecordTool = defineTool({
  id: 'airtable_block_create_record',
  name: 'Airtable: create record (block)',
  description: 'Internal: create record for the Airtable block.',
  icon: airtableIcon,
  inputs: z.object({
    baseId: z.string(),
    tableId: z.string(),
    fields: z.string(),
    typecast: z.union([z.boolean(), z.string()]).optional(),
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
  execute: airtableBlockCreateRecordExecute,
})

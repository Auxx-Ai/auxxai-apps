// src/tools/block/airtable-block-upsert-record.tool.tsx

/**
 * Internal tool backing the Airtable block's `record.upsert` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import airtableIcon from '../../assets/icon.png'
import airtableBlockUpsertRecordExecute from './airtable-block-upsert-record.tool.server'

export const airtableBlockUpsertRecordTool = defineTool({
  id: 'airtable_block_upsert_record',
  name: 'Airtable: upsert record (block)',
  description: 'Internal: upsert record for the Airtable block.',
  icon: airtableIcon,
  inputs: z.object({
    baseId: z.string(),
    tableId: z.string(),
    mergeFields: z.string(),
    fields: z.string(),
    typecast: z.union([z.boolean(), z.string()]).optional(),
  }),
  outputs: z.object({
    recordId: z.string(),
    createdTime: z.string(),
    fields: z.record(z.string(), z.unknown()),
    wasCreated: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: airtableBlockUpsertRecordExecute,
})

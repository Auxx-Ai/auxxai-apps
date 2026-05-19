// src/tools/block/airtable-block-search-records.tool.tsx

/**
 * Internal tool backing the Airtable block's `record.search` op.
 * Uses the block's raw-formula filter shape — distinct from the agent-facing
 * `search_airtable_records` tool, which exposes structured filters.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import airtableIcon from '../../assets/icon.png'
import airtableBlockSearchRecordsExecute from './airtable-block-search-records.tool.server'

export const airtableBlockSearchRecordsTool = defineTool({
  id: 'airtable_block_search_records',
  name: 'Airtable: search records (block)',
  description: 'Internal: search records for the Airtable block.',
  icon: airtableIcon,
  inputs: z.object({
    baseId: z.string(),
    tableId: z.string(),
    filterFormula: z.string().optional(),
    sortField: z.string().optional(),
    sortDirection: z.string().optional(),
    view: z.string().optional(),
    outputFields: z.string().optional(),
    returnAll: z.union([z.boolean(), z.string()]).optional(),
    limit: z.union([z.number(), z.string()]).optional(),
  }),
  outputs: z.object({
    records: z.array(z.unknown()),
    totalCount: z.string(),
    truncated: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: airtableBlockSearchRecordsExecute,
})

// src/tools/update-supabase-rows.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import supabaseIcon from '../assets/icon.png'
import updateSupabaseRowsExecute from './update-supabase-rows.tool.server'

export const updateSupabaseRowsTool = defineTool({
  id: 'update_supabase_rows',
  name: 'Update Supabase rows',
  description:
    'Update one or more rows in a Supabase table matching the given filters. Filters are mandatory to prevent accidentally updating every row. Set dryRun=true to preview which rows would be affected without mutating.',
  icon: supabaseIcon,
  inputs: z.object({
    table: z.string().describe('Table name. Use list_supabase_tables if unknown.'),
    schema: z.string().optional().describe('Postgres schema name. Defaults to "public".'),
    filters: z
      .array(
        z.object({
          column: z.string(),
          op: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is']),
          value: z.string(),
        })
      )
      .min(1)
      .describe(
        'Filter conditions identifying rows to update. At least one is required. Prefer a primary-key column for precise updates.'
      ),
    matchType: z.enum(['and', 'or']).default('and'),
    values: z
      .record(z.string(), z.unknown())
      .describe(
        'Column → new value map. Only include columns you want to change. Auto-managed columns (id, created_at) should not be set.'
      ),
    dryRun: z
      .boolean()
      .default(false)
      .describe(
        'When true, runs a SELECT with the same filters and returns the rows that WOULD be updated, without mutating. Use this to confirm with the user before destructive writes.'
      ),
  }),
  outputs: z.object({
    affectedCount: z
      .number()
      .describe('Number of rows updated (or that would be updated when dryRun=true).'),
    rows: z
      .array(z.record(z.string(), z.unknown()))
      .describe('The updated rows (or the rows that would be updated when dryRun=true).'),
    dryRun: z.boolean(),
  }),
  exampleOutput: {
    affectedCount: 1,
    rows: [
      {
        id: 42,
        email: 'jane@example.com',
        full_name: 'Jane Cooper',
        status: 'active',
        created_at: '2026-06-01T12:00:00Z',
      },
    ],
    dryRun: false,
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: updateSupabaseRowsExecute,
  agent: { toolsetSlug: 'supabase.rows.write' },
})

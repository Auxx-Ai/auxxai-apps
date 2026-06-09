// src/tools/delete-supabase-rows.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import supabaseIcon from '../assets/icon.png'
import deleteSupabaseRowsExecute from './delete-supabase-rows.tool.server'

export const deleteSupabaseRowsTool = defineTool({
  id: 'delete_supabase_rows',
  name: 'Delete Supabase rows',
  description:
    'Delete one or more rows from a Supabase table matching the given filters. Filters are mandatory to prevent accidentally deleting every row. Strongly prefer a primary-key filter for precise deletes. Set dryRun=true to preview which rows would be deleted without mutating.',
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
        'Filter conditions identifying rows to delete. At least one is required. Strongly prefer a primary-key column.'
      ),
    matchType: z.enum(['and', 'or']).default('and'),
    dryRun: z
      .boolean()
      .default(false)
      .describe(
        'When true, runs a SELECT with the same filters and returns the rows that WOULD be deleted, without mutating. Use this to confirm with the user before destructive writes.'
      ),
  }),
  outputs: z.object({
    affectedCount: z.number().describe('Number of rows deleted (or that would be deleted when dryRun=true).'),
    rows: z
      .array(z.record(z.string(), z.unknown()))
      .describe('The deleted rows (or the rows that would be deleted when dryRun=true).'),
    dryRun: z.boolean(),
  }),
  exampleOutput: {
    affectedCount: 1,
    rows: [
      {
        id: 42,
        email: 'jane@example.com',
        full_name: 'Jane Cooper',
        created_at: '2026-06-01T12:00:00Z',
      },
    ],
    dryRun: false,
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: deleteSupabaseRowsExecute,
  agent: { toolsetSlug: 'supabase.rows.write' },
})

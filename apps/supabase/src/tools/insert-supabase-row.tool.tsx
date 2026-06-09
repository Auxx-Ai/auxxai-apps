// src/tools/insert-supabase-row.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import supabaseIcon from '../assets/icon.png'
import insertSupabaseRowExecute from './insert-supabase-row.tool.server'

export const insertSupabaseRowTool = defineTool({
  id: 'insert_supabase_row',
  name: 'Insert Supabase row',
  description:
    'Insert a new row into a Supabase table. Skip auto-managed columns (id, created_at, updated_at) — they fill in server-side. Call get_supabase_table_schema first to learn required columns. Returns the inserted row including auto-generated values.',
  icon: supabaseIcon,
  inputs: z.object({
    table: z.string().describe('Table name. Use list_supabase_tables if unknown.'),
    schema: z.string().optional().describe('Postgres schema name. Defaults to "public".'),
    values: z
      .record(z.string(), z.unknown())
      .describe(
        'Column → value map. Skip auto-managed columns (id, created_at, updated_at). Call get_supabase_table_schema first to know which columns are required.'
      ),
  }),
  outputs: z.object({
    row: z
      .record(z.string(), z.unknown())
      .describe('The inserted row, including auto-generated columns.'),
  }),
  exampleOutput: {
    row: {
      id: 101,
      email: 'newcustomer@example.com',
      full_name: 'Sam Rivera',
      created_at: '2026-06-08T09:30:00Z',
      updated_at: '2026-06-08T09:30:00Z',
    },
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: insertSupabaseRowExecute,
  agent: { toolsetSlug: 'supabase.rows.write' },
})

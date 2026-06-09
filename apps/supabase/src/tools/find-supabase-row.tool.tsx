// src/tools/find-supabase-row.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import supabaseIcon from '../assets/icon.png'
import findSupabaseRowExecute from './find-supabase-row.tool.server'

export const findSupabaseRowTool = defineTool({
  id: 'find_supabase_row',
  name: 'Find Supabase row',
  description:
    'Look up a single row by matching one column to a value. Prefer a primary-key or unique column. Returns null if no row matches. Use search_supabase_rows for multi-column or multi-result queries.',
  icon: supabaseIcon,
  inputs: z.object({
    table: z.string().describe('Table name. Use list_supabase_tables if unknown.'),
    schema: z.string().optional().describe('Postgres schema name. Defaults to "public".'),
    column: z.string().describe('Column to match on. Prefer a primary key or unique column.'),
    value: z.string().describe('Value to match. Coerced to the column type server-side.'),
  }),
  outputs: z.object({
    row: z
      .record(z.string(), z.unknown())
      .nullable()
      .describe('The matched row as a column→value object, or null if no row matched.'),
  }),
  exampleOutput: {
    row: {
      id: 42,
      email: 'jane@example.com',
      full_name: 'Jane Cooper',
      created_at: '2026-06-01T12:00:00Z',
    },
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: findSupabaseRowExecute,
  agent: { toolsetSlug: 'supabase.rows.read' },
})

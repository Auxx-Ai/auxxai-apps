// src/tools/list-supabase-tables.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import supabaseIcon from '../assets/icon.png'
import listSupabaseTablesExecute from './list-supabase-tables.tool.server'

export const listSupabaseTablesTool = defineTool({
  id: 'list_supabase_tables',
  name: 'List Supabase tables',
  description:
    'List tables in the connected Supabase project. Use this once before fetching a schema or querying rows when the user has not named a table explicitly.',
  icon: supabaseIcon,
  inputs: z.object({
    schema: z
      .string()
      .optional()
      .describe(
        'Postgres schema name. Defaults to "public". Use this to discover tables in custom schemas.'
      ),
  }),
  outputs: z.object({
    schema: z.string().describe('Resolved schema name (echoed from input, defaults to "public").'),
    tables: z
      .array(
        z.object({
          name: z.string().describe('Table name to use in subsequent tool calls.'),
        })
      )
      .describe('All tables in the schema visible to the Service Role key.'),
  }),
  exampleOutput: {
    schema: 'public',
    tables: [{ name: 'customers' }, { name: 'orders' }],
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: listSupabaseTablesExecute,
  agent: {},
})

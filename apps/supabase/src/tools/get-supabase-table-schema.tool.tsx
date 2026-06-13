// src/tools/get-supabase-table-schema.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import supabaseIcon from '../assets/icon.png'
import getSupabaseTableSchemaExecute from './get-supabase-table-schema.tool.server'

export const getSupabaseTableSchemaTool = defineTool({
  id: 'get_supabase_table_schema',
  name: 'Get Supabase table schema',
  description:
    'Inspect the columns of a Supabase table. Use this before search/find/insert to learn column names, types, and which columns are required. Reads from the PostgREST OpenAPI spec.',
  icon: supabaseIcon,
  inputs: z.object({
    table: z.string().describe('Table name (e.g. "orders"). Use list_supabase_tables if unknown.'),
    schema: z.string().optional().describe('Postgres schema name. Defaults to "public".'),
  }),
  outputs: z.object({
    schema: z.string(),
    table: z.string(),
    columns: z.array(
      z.object({
        name: z
          .string()
          .describe('Column name (this is what the LLM uses in filter columns and insert keys).'),
        type: z
          .string()
          .describe('Postgres type — integer, text, timestamp with time zone, jsonb, etc.'),
        format: z
          .string()
          .optional()
          .describe('PostgREST-reported format. Disambiguates e.g. int8 vs int4 within "integer".'),
        nullable: z
          .boolean()
          .describe('True if the column accepts NULL. Required columns must be set on insert.'),
        primary: z
          .boolean()
          .describe(
            'True if this column is part of the primary key — best column to filter on in find_supabase_row.'
          ),
      })
    ),
  }),
  exampleOutput: {
    schema: 'public',
    table: 'customers',
    columns: [
      {
        name: 'id',
        type: 'integer',
        format: 'int8',
        nullable: false,
        primary: true,
      },
      {
        name: 'email',
        type: 'text',
        format: 'text',
        nullable: false,
        primary: false,
      },
      {
        name: 'created_at',
        type: 'timestamp with time zone',
        format: 'timestamptz',
        nullable: false,
        primary: false,
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getSupabaseTableSchemaExecute,
  agent: {},
})

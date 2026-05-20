// src/tools/search-supabase-rows.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import supabaseIcon from '../assets/icon.png'
import searchSupabaseRowsExecute from './search-supabase-rows.tool.server'

export const searchSupabaseRowsTool = defineTool({
  id: 'search_supabase_rows',
  name: 'Search Supabase rows',
  description:
    'Search rows in a Supabase table with structured filters. The server compiles filters into PostgREST query syntax — emit typed {column, op, value} triples. Use get_supabase_table_schema first to discover columns and types. For advanced queries (OR, full-text search, JSON paths), use the rawFilter escape hatch.',
  icon: supabaseIcon,
  inputs: z.object({
    table: z.string().describe('Table name. Use list_supabase_tables if unknown.'),
    schema: z.string().optional().describe('Postgres schema name. Defaults to "public".'),
    filters: z
      .array(
        z.object({
          column: z.string(),
          op: z
            .enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is'])
            .describe(
              'PostgREST operator. For "is", value must be "null", "true", or "false". For "like"/"ilike", use * as the wildcard.'
            ),
          value: z
            .string()
            .describe(
              'String value; coerced server-side to the column type. For "is", use "null" / "true" / "false".'
            ),
        })
      )
      .default([])
      .describe(
        'Structured filters. Combined with matchType. Leave empty to return all rows up to the limit.'
      ),
    matchType: z
      .enum(['and', 'or'])
      .default('and')
      .describe('Combine multiple filters with AND or OR.'),
    rawFilter: z
      .string()
      .optional()
      .describe(
        'Advanced: raw PostgREST filter string (e.g. "or=(name.eq.alice,name.eq.bob)" or "content=fts.hello"). Appended to the query string verbatim. Use only when filters[] cannot express the query.'
      ),
    limit: z
      .number()
      .int()
      .positive()
      .max(200)
      .default(50)
      .describe('Max rows to return. Hard cap 200 to keep chat responses bounded.'),
    orderBy: z
      .string()
      .optional()
      .describe(
        'Column to order by. Prefix with "-" for descending (e.g. "-created_at").'
      ),
  }),
  outputs: z.object({
    rows: z.array(z.record(z.string(), z.unknown())),
    totalCount: z.number().describe('Number of rows returned (≤ limit).'),
    truncated: z.boolean().describe('True if more rows likely matched but were cut off by limit.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchSupabaseRowsExecute,
  agent: { toolsetSlug: 'supabase.rows.read' },
})

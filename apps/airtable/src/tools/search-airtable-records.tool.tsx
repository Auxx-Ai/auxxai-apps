// src/tools/search-airtable-records.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import airtableIcon from '../assets/icon.png'
import searchAirtableRecordsExecute from './search-airtable-records.tool.server'

export const searchAirtableRecordsTool = defineTool({
  id: 'search_airtable_records',
  name: 'Search Airtable records',
  description:
    'Search records in an Airtable table with structured filters. The server compiles filters into Airtable formula syntax — emit typed {field, op, value} triples, not raw formulas. Use get_airtable_base_schema first to discover fields.',
  icon: airtableIcon,
  inputs: z.object({
    baseId: z.string().describe('Base id. Use list_airtable_bases if unknown.'),
    tableId: z
      .string()
      .describe('Table id. Use get_airtable_base_schema to discover tables in a base.'),
    filters: z
      .array(
        z.object({
          field: z
            .string()
            .describe(
              'Field name as it appears in the base (case-sensitive). Must exist in the table schema.'
            ),
          op: z
            .enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'isEmpty', 'isNotEmpty'])
            .describe(
              'Comparison operator. contains is case-insensitive substring match. isEmpty/isNotEmpty ignore the value.'
            ),
          value: z
            .union([z.string(), z.number(), z.boolean()])
            .nullable()
            .optional()
            .describe(
              'Value to compare against. Omit for isEmpty/isNotEmpty. Strings are matched verbatim; the server quotes them for the formula.'
            ),
        })
      )
      .optional()
      .describe(
        'Zero or more filters. Combined with AND. For compound OR / nested logic, use the Airtable workflow block.'
      ),
    viewId: z
      .string()
      .optional()
      .describe(
        "Optional saved view id from get_airtable_base_schema. When set, results respect the view's own filters and sort."
      ),
    sort: z
      .array(
        z.object({
          field: z.string(),
          direction: z.enum(['asc', 'desc']).optional(),
        })
      )
      .optional()
      .describe('Sort order. Applied after view sort if both are specified.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'Max records to return. Default 25. Hard cap 100 to keep the chat response bounded.'
      ),
    fields: z
      .array(z.string())
      .optional()
      .describe('Limit returned field names. Default: all fields. Useful for wide tables.'),
  }),
  outputs: z.object({
    records: z.array(
      z.object({
        recordId: z.string().describe('Airtable record id (e.g. recXYZ123).'),
        createdTime: z.string(),
        fields: z
          .record(z.string(), z.unknown())
          .describe(
            'Field name → value. Shape is user-defined; the LLM reads field types from get_airtable_base_schema.'
          ),
      })
    ),
    truncated: z.boolean().describe('True if more records exist beyond the limit.'),
    baseId: z.string(),
    tableId: z.string(),
  }),
  exampleOutput: {
    records: [
      {
        recordId: 'rec0AbCdEfGh1234',
        createdTime: '2026-06-01T16:30:00Z',
        fields: {
          Name: 'Acme Corp',
          Status: 'Active',
          'Annual Revenue': 1250000,
        },
      },
      {
        recordId: 'rec1BcDeFgHi5678',
        createdTime: '2026-06-02T09:12:00Z',
        fields: {
          Name: 'Globex',
          Status: 'Active',
          'Annual Revenue': 480000,
        },
      },
    ],
    truncated: false,
    baseId: 'app0123456789AbCd',
    tableId: 'tbl0123456789AbCd',
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchAirtableRecordsExecute,
  agent: { toolsetSlug: 'airtable.records' },
})

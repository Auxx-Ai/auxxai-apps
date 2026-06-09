// src/tools/get-airtable-base-schema.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import airtableIcon from '../assets/icon.png'
import getAirtableBaseSchemaExecute from './get-airtable-base-schema.tool.server'

export const getAirtableBaseSchemaTool = defineTool({
  id: 'get_airtable_base_schema',
  name: 'Get Airtable base schema',
  description:
    'Fetch tables, fields, and views for an Airtable base. Required before search_airtable_records so the LLM knows what fields exist and which ones are writable.',
  icon: airtableIcon,
  inputs: z.object({
    baseId: z.string().describe('Base id (e.g. appXYZ123). Use list_airtable_bases if unknown.'),
  }),
  outputs: z.object({
    baseId: z.string(),
    tables: z.array(
      z.object({
        tableId: z
          .string()
          .describe('Table id to use in search_airtable_records (e.g. tblABC456).'),
        name: z.string(),
        primaryFieldId: z.string(),
        fields: z.array(
          z.object({
            fieldId: z.string(),
            name: z
              .string()
              .describe(
                'Field name as written in the base (this is what the LLM uses in search filters).'
              ),
            type: z
              .string()
              .describe(
                'Airtable field type — see https://airtable.com/developers/web/api/field-model. Read-only types: formula, rollup, lookup, count, autoNumber, createdBy, createdTime, lastModifiedBy, lastModifiedTime, button, externalSyncSource, multipleLookupValues.'
              ),
            writable: z
              .boolean()
              .describe(
                'False for formula / rollup / lookup / count / autoNumber / created* / lastModified* / button / multipleLookupValues / externalSyncSource. Surfaced for forward compatibility with the write tools.'
              ),
          })
        ),
        views: z.array(
          z.object({
            viewId: z.string(),
            name: z.string(),
            type: z.string().describe('grid | form | calendar | gallery | kanban | timeline.'),
          })
        ),
      })
    ),
  }),
  exampleOutput: {
    baseId: 'app0123456789AbCd',
    tables: [
      {
        tableId: 'tbl0123456789AbCd',
        name: 'Companies',
        primaryFieldId: 'fld0123456789AbCd',
        fields: [
          {
            fieldId: 'fld0123456789AbCd',
            name: 'Name',
            type: 'singleLineText',
            writable: true,
          },
          {
            fieldId: 'fld1234567890BcDe',
            name: 'Status',
            type: 'singleSelect',
            writable: true,
          },
          {
            fieldId: 'fld2345678901CdEf',
            name: 'Annual Revenue',
            type: 'number',
            writable: true,
          },
          {
            fieldId: 'fld3456789012DeFg',
            name: 'Created',
            type: 'createdTime',
            writable: false,
          },
        ],
        views: [
          {
            viewId: 'viw0123456789AbCd',
            name: 'All companies',
            type: 'grid',
          },
          {
            viewId: 'viw1234567890BcDe',
            name: 'Active',
            type: 'grid',
          },
        ],
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: getAirtableBaseSchemaExecute,
  agent: { toolsetSlug: 'airtable.records' },
})

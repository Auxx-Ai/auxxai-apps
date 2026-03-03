// src/blocks/airtable/resources/record/record-schema.ts

/**
 * Record resource input/output field definitions.
 * Operations: Create, Delete, Get, Search, Update, Upsert
 */

import { Workflow } from '@auxx/sdk'

export const recordInputs = {
  // --- Record: Create ---
  createBase: Workflow.select({
    label: 'Base',
    description: 'Select an Airtable base',
    options: [] as { value: string; label: string }[],
  }),
  createTable: Workflow.select({
    label: 'Table',
    description: 'Select a table from the base',
    options: [] as { value: string; label: string }[],
  }),
  createFields: Workflow.string({
    label: 'Fields',
    description: 'Field values as JSON object. E.g. {"Name": "John", "Email": "john@acme.com"}',
    placeholder: '{"Field Name": "value", ...}',
    acceptsVariables: true,
  }),
  createTypecast: Workflow.boolean({
    label: 'Typecast',
    description: 'Auto-convert string values to appropriate field types (linked records, selects, etc.)',
    default: false,
  }),

  // --- Record: Delete ---
  deleteBase: Workflow.select({
    label: 'Base',
    description: 'Select an Airtable base',
    options: [] as { value: string; label: string }[],
  }),
  deleteTable: Workflow.select({
    label: 'Table',
    description: 'Select a table from the base',
    options: [] as { value: string; label: string }[],
  }),
  deleteRecordId: Workflow.string({
    label: 'Record ID',
    description: 'The ID of the record to delete (e.g. recABC123)',
    placeholder: 'recABC123',
    acceptsVariables: true,
  }),

  // --- Record: Get ---
  getBase: Workflow.select({
    label: 'Base',
    description: 'Select an Airtable base',
    options: [] as { value: string; label: string }[],
  }),
  getTable: Workflow.select({
    label: 'Table',
    description: 'Select a table from the base',
    options: [] as { value: string; label: string }[],
  }),
  getRecordId: Workflow.string({
    label: 'Record ID',
    description: 'The ID of the record to retrieve (e.g. recABC123)',
    placeholder: 'recABC123',
    acceptsVariables: true,
  }),

  // --- Record: Search ---
  searchBase: Workflow.select({
    label: 'Base',
    description: 'Select an Airtable base',
    options: [] as { value: string; label: string }[],
  }),
  searchTable: Workflow.select({
    label: 'Table',
    description: 'Select a table from the base',
    options: [] as { value: string; label: string }[],
  }),
  searchFilterFormula: Workflow.string({
    label: 'Filter Formula',
    description: 'Airtable formula to filter records. E.g. NOT({Name} = \'\')',
    placeholder: 'NOT({Status} = "Done")',
    acceptsVariables: true,
  }),
  searchReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Paginate through all results (up to 5,000 records)',
    default: false,
  }),
  searchLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of records to return (1-100)',
    default: 100,
    min: 1,
    max: 100,
  }),
  searchSortField: Workflow.select({
    label: 'Sort By',
    description: 'Field to sort results by',
    options: [] as { value: string; label: string }[],
  }),
  searchSortDirection: Workflow.select({
    label: 'Sort Direction',
    options: [
      { value: 'asc', label: 'Ascending' },
      { value: 'desc', label: 'Descending' },
    ],
    default: 'asc',
  }),
  searchView: Workflow.select({
    label: 'View',
    description: 'Filter results by a specific view',
    options: [] as { value: string; label: string }[],
  }),
  searchOutputFields: Workflow.string({
    label: 'Output Fields',
    description: 'Comma-separated field names to include in results (leave empty for all)',
    placeholder: 'Name, Email, Status',
    acceptsVariables: true,
  }),

  // --- Record: Update ---
  updateBase: Workflow.select({
    label: 'Base',
    description: 'Select an Airtable base',
    options: [] as { value: string; label: string }[],
  }),
  updateTable: Workflow.select({
    label: 'Table',
    description: 'Select a table from the base',
    options: [] as { value: string; label: string }[],
  }),
  updateRecordId: Workflow.string({
    label: 'Record ID',
    description: 'The ID of the record to update (e.g. recABC123)',
    placeholder: 'recABC123',
    acceptsVariables: true,
  }),
  updateFields: Workflow.string({
    label: 'Fields',
    description: 'Field values as JSON object. E.g. {"Status": "Done", "Notes": "Updated"}',
    placeholder: '{"Field Name": "value", ...}',
    acceptsVariables: true,
  }),
  updateTypecast: Workflow.boolean({
    label: 'Typecast',
    description: 'Auto-convert string values to appropriate field types',
    default: false,
  }),

  // --- Record: Upsert ---
  upsertBase: Workflow.select({
    label: 'Base',
    description: 'Select an Airtable base',
    options: [] as { value: string; label: string }[],
  }),
  upsertTable: Workflow.select({
    label: 'Table',
    description: 'Select a table from the base',
    options: [] as { value: string; label: string }[],
  }),
  upsertMergeFields: Workflow.string({
    label: 'Fields to Match On',
    description: 'Comma-separated field names to match existing records. E.g. "Email" or "Email, Name"',
    placeholder: 'Email',
    acceptsVariables: true,
  }),
  upsertFields: Workflow.string({
    label: 'Fields',
    description: 'Field values as JSON object. E.g. {"Name": "John", "Email": "john@acme.com"}',
    placeholder: '{"Field Name": "value", ...}',
    acceptsVariables: true,
  }),
  upsertTypecast: Workflow.boolean({
    label: 'Typecast',
    description: 'Auto-convert string values to appropriate field types',
    default: false,
  }),
}

export function recordComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      recordId: Workflow.string({ label: 'Record ID' }),
      createdTime: Workflow.string({ label: 'Created Time' }),
      fields: Workflow.string({ label: 'Fields (JSON)' }),
    }
  }
  if (operation === 'delete') {
    return {
      deletedRecordId: Workflow.string({ label: 'Deleted Record ID' }),
      deleted: Workflow.string({ label: 'Deleted' }),
    }
  }
  if (operation === 'get') {
    return {
      recordId: Workflow.string({ label: 'Record ID' }),
      createdTime: Workflow.string({ label: 'Created Time' }),
      fields: Workflow.string({ label: 'Fields (JSON)' }),
    }
  }
  if (operation === 'search') {
    return {
      records: Workflow.string({ label: 'Records (JSON)' }),
      totalCount: Workflow.string({ label: 'Total Count' }),
      truncated: Workflow.string({ label: 'Truncated' }),
    }
  }
  if (operation === 'update') {
    return {
      recordId: Workflow.string({ label: 'Record ID' }),
      fields: Workflow.string({ label: 'Fields (JSON)' }),
    }
  }
  if (operation === 'upsert') {
    return {
      recordId: Workflow.string({ label: 'Record ID' }),
      createdTime: Workflow.string({ label: 'Created Time' }),
      fields: Workflow.string({ label: 'Fields (JSON)' }),
      wasCreated: Workflow.string({ label: 'Was Created' }),
    }
  }
  return {}
}

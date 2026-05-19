// src/blocks/supabase/resources/row/row-schema.ts

/**
 * Row resource input/output field definitions.
 * Operations: Create, Delete, Get, Get Many, Update
 *
 * Field prefixes (create*, get*, getMany*, update*, delete*) keep each
 * operation's state isolated so switching operations doesn't blow away
 * unrelated values.
 */

import { Workflow } from '@auxx/sdk'
import { FILTER_CONDITIONS, FILTER_TYPES, FILTER_TYPES_WITH_NONE, MATCH_TYPES } from '../constants'

const filterItem = Workflow.struct({
  column: Workflow.select({
    label: 'Column',
    options: [] as { value: string; label: string }[],
  }),
  condition: Workflow.select({
    label: 'Condition',
    options: FILTER_CONDITIONS as any,
    default: 'eq',
  }),
  value: Workflow.string({
    label: 'Value',
    acceptsVariables: true,
  }),
})

const fieldItem = Workflow.struct({
  fieldName: Workflow.select({
    label: 'Column',
    options: [] as { value: string; label: string }[],
  }),
  fieldValue: Workflow.string({
    label: 'Value',
    acceptsVariables: true,
  }),
})

export const rowInputs = {
  // --- Row: Create ---
  createTable: Workflow.select({
    label: 'Table',
    description: 'Select a table',
    options: [] as { value: string; label: string }[],
  }),
  createFields: Workflow.array({
    label: 'Fields',
    description: 'Column values for the new row',
    items: fieldItem,
  }),
  createCustomSchema: Workflow.boolean({
    label: 'Use Custom Schema',
    description: 'Insert into a non-public Postgres schema',
    default: false,
  }),
  createSchema: Workflow.string({
    label: 'Schema',
    description: 'Postgres schema name',
    default: 'public',
    placeholder: 'public',
  }),

  // --- Row: Delete ---
  deleteTable: Workflow.select({
    label: 'Table',
    options: [] as { value: string; label: string }[],
  }),
  deleteFilterType: Workflow.select({
    label: 'Filter Type',
    options: FILTER_TYPES as any,
    default: 'manual',
  }),
  deleteMatchType: Workflow.select({
    label: 'Match',
    options: MATCH_TYPES as any,
    default: 'allFilters',
  }),
  deleteFilters: Workflow.array({
    label: 'Conditions',
    description: 'Filter conditions identifying rows to delete',
    items: filterItem,
  }),
  deleteFilterString: Workflow.string({
    label: 'Filter String',
    description: 'Raw PostgREST filter (e.g. name=eq.john&age=gt.18)',
    placeholder: 'name=eq.john',
    acceptsVariables: true,
  }),
  deleteCustomSchema: Workflow.boolean({
    label: 'Use Custom Schema',
    default: false,
  }),
  deleteSchema: Workflow.string({
    label: 'Schema',
    default: 'public',
  }),

  // --- Row: Get ---
  getTable: Workflow.select({
    label: 'Table',
    options: [] as { value: string; label: string }[],
  }),
  getFilterType: Workflow.select({
    label: 'Filter Type',
    options: FILTER_TYPES as any,
    default: 'manual',
  }),
  getMatchType: Workflow.select({
    label: 'Match',
    options: MATCH_TYPES as any,
    default: 'allFilters',
  }),
  getFilters: Workflow.array({
    label: 'Conditions',
    description: 'Filter conditions identifying the row to fetch',
    items: filterItem,
  }),
  getFilterString: Workflow.string({
    label: 'Filter String',
    description: 'Raw PostgREST filter (e.g. id=eq.5)',
    placeholder: 'id=eq.5',
    acceptsVariables: true,
  }),
  getCustomSchema: Workflow.boolean({
    label: 'Use Custom Schema',
    default: false,
  }),
  getSchema: Workflow.string({
    label: 'Schema',
    default: 'public',
  }),

  // --- Row: Get Many ---
  getManyTable: Workflow.select({
    label: 'Table',
    options: [] as { value: string; label: string }[],
  }),
  getManyFilterType: Workflow.select({
    label: 'Filter Type',
    options: FILTER_TYPES_WITH_NONE as any,
    default: 'none',
  }),
  getManyMatchType: Workflow.select({
    label: 'Match',
    options: MATCH_TYPES as any,
    default: 'allFilters',
  }),
  getManyFilters: Workflow.array({
    label: 'Conditions',
    description: 'Filter conditions',
    items: filterItem,
  }),
  getManyFilterString: Workflow.string({
    label: 'Filter String',
    description: 'Raw PostgREST filter',
    placeholder: 'status=eq.active',
    acceptsVariables: true,
  }),
  getManyReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Paginate through all results (up to 50,000 rows)',
    default: false,
  }),
  getManyLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum rows to return',
    default: 50,
    min: 1,
    max: 1000,
  }),
  getManyCustomSchema: Workflow.boolean({
    label: 'Use Custom Schema',
    default: false,
  }),
  getManySchema: Workflow.string({
    label: 'Schema',
    default: 'public',
  }),

  // --- Row: Update ---
  updateTable: Workflow.select({
    label: 'Table',
    options: [] as { value: string; label: string }[],
  }),
  updateFilterType: Workflow.select({
    label: 'Filter Type',
    options: FILTER_TYPES as any,
    default: 'manual',
  }),
  updateMatchType: Workflow.select({
    label: 'Match',
    options: MATCH_TYPES as any,
    default: 'allFilters',
  }),
  updateFilters: Workflow.array({
    label: 'Conditions',
    description: 'Filter conditions identifying rows to update',
    items: filterItem,
  }),
  updateFilterString: Workflow.string({
    label: 'Filter String',
    description: 'Raw PostgREST filter',
    placeholder: 'id=eq.5',
    acceptsVariables: true,
  }),
  updateFields: Workflow.array({
    label: 'Fields',
    description: 'Column values to set',
    items: fieldItem,
  }),
  updateCustomSchema: Workflow.boolean({
    label: 'Use Custom Schema',
    default: false,
  }),
  updateSchema: Workflow.string({
    label: 'Schema',
    default: 'public',
  }),
}

export function rowComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      row: Workflow.string({ label: 'Row (JSON)' }),
    }
  }
  if (operation === 'delete') {
    return {
      rows: Workflow.string({ label: 'Deleted Rows (JSON)' }),
      totalCount: Workflow.string({ label: 'Deleted Count' }),
    }
  }
  if (operation === 'get') {
    return {
      rows: Workflow.string({ label: 'Rows (JSON)' }),
      totalCount: Workflow.string({ label: 'Total Count' }),
    }
  }
  if (operation === 'getMany') {
    return {
      rows: Workflow.string({ label: 'Rows (JSON)' }),
      totalCount: Workflow.string({ label: 'Total Count' }),
      truncated: Workflow.string({ label: 'Truncated' }),
    }
  }
  if (operation === 'update') {
    return {
      rows: Workflow.string({ label: 'Updated Rows (JSON)' }),
      totalCount: Workflow.string({ label: 'Updated Count' }),
    }
  }
  return {}
}

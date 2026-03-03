// src/blocks/notion/resources/database/database-schema.ts

/**
 * Database resource input/output field definitions.
 * Operations: Get, Get Many, Search
 */

import { Workflow } from '@auxx/sdk'

export const databaseInputs = {
  // --- Database: Get ---
  getDatabaseId: Workflow.select({
    label: 'Database',
    description: 'Select a Notion database',
    options: [] as { value: string; label: string }[],
  }),

  // --- Database: Get Many ---
  getManyDbReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Paginate through all results',
    default: false,
  }),
  getManyDbLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of databases to return (1-100)',
    default: 100,
    min: 1,
    max: 100,
  }),

  // --- Database: Search ---
  searchDbText: Workflow.string({
    label: 'Search Text',
    description: 'Text to search for across databases',
    placeholder: 'Search query...',
    acceptsVariables: true,
  }),
  searchDbReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Paginate through all results',
    default: false,
  }),
  searchDbLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of results to return (1-100)',
    default: 100,
    min: 1,
    max: 100,
  }),
  searchDbSortDirection: Workflow.select({
    label: 'Sort Direction',
    options: [
      { value: 'descending', label: 'Descending' },
      { value: 'ascending', label: 'Ascending' },
    ],
    default: 'descending',
  }),
}

export function databaseComputeOutputs(operation: string) {
  if (operation === 'get') {
    return {
      databaseId: Workflow.string({ label: 'Database ID' }),
      title: Workflow.string({ label: 'Title' }),
      url: Workflow.string({ label: 'URL' }),
      properties: Workflow.string({ label: 'Properties (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      databases: Workflow.string({ label: 'Databases (JSON)' }),
      totalCount: Workflow.string({ label: 'Total Count' }),
    }
  }
  if (operation === 'search') {
    return {
      databases: Workflow.string({ label: 'Databases (JSON)' }),
      totalCount: Workflow.string({ label: 'Total Count' }),
      truncated: Workflow.string({ label: 'Truncated' }),
    }
  }
  return {}
}

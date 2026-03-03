// src/blocks/notion/resources/database-page/database-page-schema.ts

/**
 * Database Page resource input/output field definitions.
 * Operations: Create, Get, Get Many, Update
 */

import { Workflow } from '@auxx/sdk'

export const databasePageInputs = {
  // --- Database Page: Create ---
  createDatabaseId: Workflow.select({
    label: 'Database',
    description: 'Select a Notion database to create a page in',
    options: [] as { value: string; label: string }[],
  }),
  createTitle: Workflow.string({
    label: 'Title',
    description: 'Page title (maps to the database title property)',
    placeholder: 'New page title',
    acceptsVariables: true,
  }),
  createProperties: Workflow.array({
    label: 'Properties',
    description: 'Property values to set on the new page',
    items: Workflow.struct({
      fields: {
        propertyName: Workflow.select({
          label: 'Property',
          options: [] as { value: string; label: string }[],
        }),
        propertyValue: Workflow.string({
          label: 'Value',
          acceptsVariables: true,
        }),
      },
    }),
  }),
  createContent: Workflow.string({
    label: 'Content',
    description: 'Optional plain text content for the page body (added as a paragraph block)',
    placeholder: 'Page body text...',
    acceptsVariables: true,
  }),

  // --- Database Page: Get ---
  getPageId: Workflow.string({
    label: 'Page ID',
    description: 'The Notion page ID (UUID)',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    acceptsVariables: true,
  }),

  // --- Database Page: Get Many ---
  getManyDatabaseId: Workflow.select({
    label: 'Database',
    description: 'Select a Notion database to query',
    options: [] as { value: string; label: string }[],
  }),
  getManyReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Paginate through all results (up to 5,000 pages)',
    default: false,
  }),
  getManyLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of pages to return (1-100)',
    default: 100,
    min: 1,
    max: 100,
  }),
  getManyFilterType: Workflow.select({
    label: 'Filter Type',
    options: [
      { value: 'none', label: 'None' },
      { value: 'simple', label: 'Simple' },
      { value: 'json', label: 'JSON' },
    ],
    default: 'none',
  }),
  getManyFilterProperty: Workflow.select({
    label: 'Filter Property',
    description: 'Property to filter by',
    options: [] as { value: string; label: string }[],
  }),
  getManyFilterCondition: Workflow.select({
    label: 'Condition',
    description: 'Filter condition',
    options: [] as { value: string; label: string }[],
  }),
  getManyFilterValue: Workflow.string({
    label: 'Filter Value',
    description: 'Value to filter by',
    acceptsVariables: true,
  }),
  getManyFilterJson: Workflow.string({
    label: 'Filter JSON',
    description: 'Raw Notion filter object as JSON',
    placeholder: '{"property": "Status", "select": {"equals": "Done"}}',
    acceptsVariables: true,
  }),
  getManySortProperty: Workflow.select({
    label: 'Sort By',
    description: 'Property to sort results by',
    options: [] as { value: string; label: string }[],
  }),
  getManySortDirection: Workflow.select({
    label: 'Sort Direction',
    options: [
      { value: 'ascending', label: 'Ascending' },
      { value: 'descending', label: 'Descending' },
    ],
    default: 'ascending',
  }),
  getManySortTimestamp: Workflow.select({
    label: 'Sort By Timestamp',
    description: 'Sort by created or last edited time instead of a property',
    options: [
      { value: '', label: 'None' },
      { value: 'created_time', label: 'Created Time' },
      { value: 'last_edited_time', label: 'Last Edited Time' },
    ],
    default: '',
  }),

  // --- Database Page: Update ---
  updatePageId: Workflow.string({
    label: 'Page ID',
    description: 'The Notion page ID to update',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    acceptsVariables: true,
  }),
  updateDatabaseId: Workflow.select({
    label: 'Database',
    description: 'Select the database (to load property options)',
    options: [] as { value: string; label: string }[],
  }),
  updateProperties: Workflow.array({
    label: 'Properties',
    description: 'Property values to update',
    items: Workflow.struct({
      fields: {
        propertyName: Workflow.select({
          label: 'Property',
          options: [] as { value: string; label: string }[],
        }),
        propertyValue: Workflow.string({
          label: 'Value',
          acceptsVariables: true,
        }),
      },
    }),
  }),
}

export function databasePageComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      pageId: Workflow.string({ label: 'Page ID' }),
      url: Workflow.string({ label: 'URL' }),
      createdTime: Workflow.string({ label: 'Created Time' }),
      properties: Workflow.string({ label: 'Properties (JSON)' }),
    }
  }
  if (operation === 'get') {
    return {
      pageId: Workflow.string({ label: 'Page ID' }),
      url: Workflow.string({ label: 'URL' }),
      createdTime: Workflow.string({ label: 'Created Time' }),
      lastEditedTime: Workflow.string({ label: 'Last Edited Time' }),
      properties: Workflow.string({ label: 'Properties (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      pages: Workflow.string({ label: 'Pages (JSON)' }),
      totalCount: Workflow.string({ label: 'Total Count' }),
      truncated: Workflow.string({ label: 'Truncated' }),
    }
  }
  if (operation === 'update') {
    return {
      pageId: Workflow.string({ label: 'Page ID' }),
      url: Workflow.string({ label: 'URL' }),
      lastEditedTime: Workflow.string({ label: 'Last Edited Time' }),
      properties: Workflow.string({ label: 'Properties (JSON)' }),
    }
  }
  return {}
}

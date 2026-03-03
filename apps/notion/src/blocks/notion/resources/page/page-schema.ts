// src/blocks/notion/resources/page/page-schema.ts

/**
 * Page resource input/output field definitions.
 * Operations: Archive, Create, Search
 */

import { Workflow } from '@auxx/sdk'

export const pageInputs = {
  // --- Page: Archive ---
  archivePageId: Workflow.string({
    label: 'Page ID',
    description: 'The Notion page ID to archive',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    acceptsVariables: true,
  }),

  // --- Page: Create ---
  createPageParentId: Workflow.string({
    label: 'Parent Page ID',
    description: 'The parent page ID to create the child page under',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    acceptsVariables: true,
  }),
  createPageTitle: Workflow.string({
    label: 'Title',
    description: 'Page title',
    placeholder: 'New page title',
    acceptsVariables: true,
  }),
  createPageContent: Workflow.string({
    label: 'Content',
    description: 'Optional plain text content (added as a paragraph block)',
    placeholder: 'Page body text...',
    acceptsVariables: true,
  }),
  createPageIcon: Workflow.string({
    label: 'Icon Emoji',
    description: 'Optional emoji icon for the page (e.g., "📝")',
    placeholder: '📝',
  }),

  // --- Page: Search ---
  searchText: Workflow.string({
    label: 'Search Text',
    description: 'Text to search for across all pages and databases',
    placeholder: 'Search query...',
    acceptsVariables: true,
  }),
  searchReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Paginate through all results',
    default: false,
  }),
  searchLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of results to return (1-100)',
    default: 100,
    min: 1,
    max: 100,
  }),
  searchFilterObject: Workflow.select({
    label: 'Filter Object Type',
    description: 'Filter by object type',
    options: [
      { value: '', label: 'Both' },
      { value: 'page', label: 'Page' },
      { value: 'database', label: 'Database' },
    ],
    default: '',
  }),
  searchSortDirection: Workflow.select({
    label: 'Sort Direction',
    options: [
      { value: 'descending', label: 'Descending' },
      { value: 'ascending', label: 'Ascending' },
    ],
    default: 'descending',
  }),
}

export function pageComputeOutputs(operation: string) {
  if (operation === 'archive') {
    return {
      pageId: Workflow.string({ label: 'Page ID' }),
      archived: Workflow.string({ label: 'Archived' }),
    }
  }
  if (operation === 'create') {
    return {
      pageId: Workflow.string({ label: 'Page ID' }),
      url: Workflow.string({ label: 'URL' }),
      createdTime: Workflow.string({ label: 'Created Time' }),
    }
  }
  if (operation === 'search') {
    return {
      results: Workflow.string({ label: 'Results (JSON)' }),
      totalCount: Workflow.string({ label: 'Total Count' }),
      truncated: Workflow.string({ label: 'Truncated' }),
    }
  }
  return {}
}

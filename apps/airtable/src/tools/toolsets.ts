// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Toolsets exposed by airtable. The platform projects each `id` into the
 * runtime slug namespace as `app:airtable:<localId>` for agent-side filtering.
 * See plans/kopilot/apps/airtable-overhaul.md §5.
 *
 * `list_airtable_bases` is toolset-less and auto-attaches whenever
 * `airtable.records` is enabled. No isDefault — admins opt in deliberately.
 */
export const airtableToolsets: Toolset[] = [
  {
    id: 'airtable.records',
    name: 'Airtable records',
    description:
      'Browse Airtable bases, inspect table schemas, and search records with structured filters.',
    tools: ['get_airtable_base_schema', 'search_airtable_records'],
  },
]

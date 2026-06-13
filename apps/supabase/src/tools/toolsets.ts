// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Toolsets exposed by Supabase. The platform projects each `id` into the
 * runtime slug namespace as `app:supabase:<localId>` for agent-side filtering.
 * See plans/kopilot/apps/supabase-overhaul.md §5.
 *
 * `list_supabase_tables` and `get_supabase_table_schema` are toolset-less
 * and auto-attach whenever any `supabase.rows.*` toolset is enabled.
 *
 * The write toolset includes destructive ops (update/delete) — both require
 * non-empty filters and support a dryRun preview flag.
 */
export const supabaseToolsets: Toolset[] = [
  {
    id: 'supabase.rows.read',
    name: 'Supabase rows (read)',
    description: 'Discover tables, inspect column schemas, and query rows. No writes.',
    tools: ['find_supabase_row', 'search_supabase_rows'],
  },
  {
    id: 'supabase.rows.write',
    name: 'Supabase rows (write)',
    description:
      'Insert, update, and delete rows in Supabase tables. Update and delete require non-empty filters and support dryRun preview.',
    tools: ['insert_supabase_row', 'update_supabase_rows', 'delete_supabase_rows'],
  },
]

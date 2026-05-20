// src/blocks/supabase/tool-map.ts

/**
 * Dispatch table for the supabase block. Resolves each `(resource, operation)`
 * pair to the tool id that implements it. Both the block declaration (for
 * catalog publish) and the runtime dispatcher consume this map so they stay
 * in lockstep.
 */
export const supabaseToolMap = {
  'row.create': 'insert_supabase_row',
  'row.get': 'search_supabase_rows',
  'row.getMany': 'search_supabase_rows',
  'row.update': 'update_supabase_rows',
  'row.delete': 'delete_supabase_rows',
} as const satisfies Record<string, string>

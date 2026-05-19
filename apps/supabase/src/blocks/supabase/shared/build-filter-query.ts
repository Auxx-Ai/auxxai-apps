// src/blocks/supabase/shared/build-filter-query.ts

/**
 * Compile structured filter conditions into PostgREST query params.
 *
 * AND mode: each condition becomes its own `column=op.value` param.
 * OR mode: conditions wrap into a single `or=(col1.op.val,col2.op.val)` param.
 *
 * Per the overhaul plan §16, this is shared between the workflow block
 * surface and the chat-tool surface.
 */

export type Filter = {
  column: string
  condition: string
  value: string
}

export type MatchType = 'allFilters' | 'anyFilter'

export function buildFilterQuery(
  filters: Filter[],
  matchType: MatchType
): Record<string, string> {
  if (!filters || filters.length === 0) return {}

  if (matchType === 'anyFilter') {
    const conditions = filters.map((f) => `${f.column}.${f.condition}.${encodeFilterValue(f.value)}`)
    return { or: `(${conditions.join(',')})` }
  }

  const qs: Record<string, string> = {}
  for (const f of filters) {
    qs[f.column] = `${f.condition}.${encodeFilterValue(f.value)}`
  }
  return qs
}

/**
 * PostgREST filter values containing commas, parens, or dots inside an
 * `or=(...)` clause need to be wrapped in double quotes. Outside that
 * clause they pass through as URL-encoded strings.
 *
 * For v1 we keep it simple: no quoting. Most chat queries (eq, gt, like)
 * don't need it. The `rawFilter` escape hatch on the tool surface is the
 * release valve for anything that does.
 */
function encodeFilterValue(value: string): string {
  return value
}

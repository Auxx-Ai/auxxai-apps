// src/tools/shared/compile-filter.ts

/**
 * Compile a structured `Filter[]` array into an Airtable `filterByFormula`
 * string. Keeps LLM-visible inputs typed and shifts the burden of writing
 * correct Airtable formula syntax (quoting, brace escaping, BLANK() vs "")
 * to the server.
 *
 * See plans/kopilot/apps/airtable-overhaul.md §7 (compile rules) and §4.3
 * (filter shape). Empty array → empty string (caller skips the query param).
 * Single filter → unwrapped, no AND() wrapper.
 */

export type FilterOp =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'isEmpty'
  | 'isNotEmpty'

export interface Filter {
  field: string
  op: FilterOp
  value?: string | number | boolean | null
}

/** Escape a field name for use in `{Field Name}` reference. Airtable disallows
 *  `{` and `}` inside field names, so this is a wrap-only step. */
function fieldRef(name: string): string {
  return `{${name}}`
}

/** Quote a value for an Airtable formula. Strings get single quotes with
 *  embedded `'` doubled per the spec. Numbers/booleans serialize verbatim. */
function quoteValue(value: string | number | boolean): string {
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'TRUE()' : 'FALSE()'
  return `'${String(value).replace(/'/g, "''")}'`
}

function compileOne(filter: Filter): string {
  const ref = fieldRef(filter.field)
  switch (filter.op) {
    case 'eq':
      return `${ref}=${quoteValue(filter.value as string | number | boolean)}`
    case 'neq':
      return `${ref}!=${quoteValue(filter.value as string | number | boolean)}`
    case 'gt':
      return `${ref}>${quoteValue(filter.value as string | number | boolean)}`
    case 'gte':
      return `${ref}>=${quoteValue(filter.value as string | number | boolean)}`
    case 'lt':
      return `${ref}<${quoteValue(filter.value as string | number | boolean)}`
    case 'lte':
      return `${ref}<=${quoteValue(filter.value as string | number | boolean)}`
    case 'contains':
      return `FIND(LOWER(${quoteValue(filter.value as string | number | boolean)}), LOWER(${ref}))`
    case 'isEmpty':
      return `${ref}=BLANK()`
    case 'isNotEmpty':
      return `${ref}!=BLANK()`
  }
}

export function compileFilters(filters: Filter[]): string {
  if (filters.length === 0) return ''
  if (filters.length === 1) return compileOne(filters[0])
  return `AND(${filters.map(compileOne).join(',')})`
}

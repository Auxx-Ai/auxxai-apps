// src/blocks/supabase/resources/constants.ts

export const RESOURCES = [{ value: 'row', label: 'Row' }] as const

export const OPERATIONS = {
  row: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
} as const

export const ALL_OPERATIONS = [
  { value: 'create', label: 'Create' },
  { value: 'delete', label: 'Delete' },
  { value: 'get', label: 'Get' },
  { value: 'getMany', label: 'Get Many' },
  { value: 'update', label: 'Update' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  row: ['create', 'delete', 'get', 'getMany', 'update'],
}

export const FILTER_CONDITIONS = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not Equals' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less Than or Equal' },
  { value: 'like', label: 'LIKE (use * for %)' },
  { value: 'ilike', label: 'ILIKE (case insensitive)' },
  { value: 'is', label: 'IS (null, true, false)' },
] as const

export const MATCH_TYPES = [
  { value: 'allFilters', label: 'All Filters (AND)' },
  { value: 'anyFilter', label: 'Any Filter (OR)' },
] as const

export const FILTER_TYPES_WITH_NONE = [
  { value: 'none', label: 'No Filter' },
  { value: 'manual', label: 'Manual' },
  { value: 'string', label: 'PostgREST String' },
] as const

export const FILTER_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'string', label: 'PostgREST String' },
] as const

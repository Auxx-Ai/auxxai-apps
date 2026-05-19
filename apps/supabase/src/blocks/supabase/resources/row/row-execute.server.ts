// src/blocks/supabase/resources/row/row-execute.server.ts

import { getOrganizationConnection, getOrganizationSetting } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import {
  supabaseApi,
  supabasePaginatedGet,
  throwConnectionNotFound,
  throwProjectUrlNotSet,
  toSupabaseFields,
} from '../../shared/supabase-api'
import { buildFilterQuery, type Filter, type MatchType } from '../../shared/build-filter-query'
import { getSchemaHeaders } from '../../shared/get-schema-headers'

type Auth = { serviceRoleKey: string; projectUrl: string }

export async function executeRow(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const projectUrl = await getOrganizationSetting<string>('projectUrl')
  if (!projectUrl) throwProjectUrlNotSet()

  const auth: Auth = { serviceRoleKey: connection.value, projectUrl }

  switch (operation) {
    case 'create':
      return createRow(auth, input)
    case 'delete':
      return deleteRow(auth, input)
    case 'get':
      return getRow(auth, input)
    case 'getMany':
      return getManyRows(auth, input)
    case 'update':
      return updateRow(auth, input)
    default:
      throw new Error(`Unknown row operation: ${operation}`)
  }
}

// ----- Create -----

async function createRow(auth: Auth, input: Record<string, any>): Promise<Record<string, any>> {
  const table = requireTable(input.createTable, 'createTable')
  const fields = toSupabaseFields(input.createFields ?? [])
  if (Object.keys(fields).length === 0) {
    throw new BlockValidationError([
      { field: 'createFields', message: 'At least one column value is required.' },
    ])
  }
  const headers = getSchemaHeaders('POST', !!input.createCustomSchema, input.createSchema)

  const result = await supabaseApi('POST', `/${encodeURIComponent(table)}`, auth.serviceRoleKey, auth.projectUrl, {
    body: fields,
    headers,
  })

  const row = Array.isArray(result) ? result[0] : result
  return { row: JSON.stringify(row ?? null) }
}

// ----- Delete -----

async function deleteRow(auth: Auth, input: Record<string, any>): Promise<Record<string, any>> {
  const table = requireTable(input.deleteTable, 'deleteTable')
  const { qs, rawSuffix } = compileFilter({
    filterType: input.deleteFilterType ?? 'manual',
    filters: input.deleteFilters,
    filterString: input.deleteFilterString,
    matchType: input.deleteMatchType,
    fieldName: 'deleteFilters',
    requireFilter: true,
  })

  const headers = getSchemaHeaders('DELETE', !!input.deleteCustomSchema, input.deleteSchema)
  const endpoint = appendRawSuffix(`/${encodeURIComponent(table)}`, rawSuffix)

  const result = await supabaseApi('DELETE', endpoint, auth.serviceRoleKey, auth.projectUrl, {
    qs,
    headers,
  })

  const rows = Array.isArray(result) ? result : []
  return {
    rows: JSON.stringify(rows),
    totalCount: String(rows.length),
  }
}

// ----- Get -----

async function getRow(auth: Auth, input: Record<string, any>): Promise<Record<string, any>> {
  const table = requireTable(input.getTable, 'getTable')
  const { qs, rawSuffix } = compileFilter({
    filterType: input.getFilterType ?? 'manual',
    filters: input.getFilters,
    filterString: input.getFilterString,
    matchType: input.getMatchType,
    fieldName: 'getFilters',
    requireFilter: true,
  })

  const headers = getSchemaHeaders('GET', !!input.getCustomSchema, input.getSchema)
  const endpoint = appendRawSuffix(`/${encodeURIComponent(table)}`, rawSuffix)

  const rows = await supabaseApi('GET', endpoint, auth.serviceRoleKey, auth.projectUrl, {
    qs,
    headers,
  })

  const list = Array.isArray(rows) ? rows : []
  return {
    rows: JSON.stringify(list),
    totalCount: String(list.length),
  }
}

// ----- Get Many -----

async function getManyRows(auth: Auth, input: Record<string, any>): Promise<Record<string, any>> {
  const table = requireTable(input.getManyTable, 'getManyTable')
  const filterType = input.getManyFilterType ?? 'none'
  const { qs, rawSuffix } =
    filterType === 'none'
      ? { qs: {}, rawSuffix: '' }
      : compileFilter({
          filterType,
          filters: input.getManyFilters,
          filterString: input.getManyFilterString,
          matchType: input.getManyMatchType,
          fieldName: 'getManyFilters',
          requireFilter: false,
        })

  const headers = getSchemaHeaders('GET', !!input.getManyCustomSchema, input.getManySchema)
  const endpoint = appendRawSuffix(`/${encodeURIComponent(table)}`, rawSuffix)
  const returnAll = coerceBool(input.getManyReturnAll)
  const limit = Number(input.getManyLimit) || 50

  const { rows, truncated } = await supabasePaginatedGet(
    endpoint,
    auth.serviceRoleKey,
    auth.projectUrl,
    qs,
    { returnAll, limit, headers }
  )

  return {
    rows: JSON.stringify(rows),
    totalCount: String(rows.length),
    truncated: String(truncated),
  }
}

// ----- Update -----

async function updateRow(auth: Auth, input: Record<string, any>): Promise<Record<string, any>> {
  const table = requireTable(input.updateTable, 'updateTable')
  const fields = toSupabaseFields(input.updateFields ?? [])
  if (Object.keys(fields).length === 0) {
    throw new BlockValidationError([
      { field: 'updateFields', message: 'At least one column value to set is required.' },
    ])
  }
  const { qs, rawSuffix } = compileFilter({
    filterType: input.updateFilterType ?? 'manual',
    filters: input.updateFilters,
    filterString: input.updateFilterString,
    matchType: input.updateMatchType,
    fieldName: 'updateFilters',
    requireFilter: true,
  })

  const headers = getSchemaHeaders('PATCH', !!input.updateCustomSchema, input.updateSchema)
  const endpoint = appendRawSuffix(`/${encodeURIComponent(table)}`, rawSuffix)

  const result = await supabaseApi('PATCH', endpoint, auth.serviceRoleKey, auth.projectUrl, {
    body: fields,
    qs,
    headers,
  })

  const rows = Array.isArray(result) ? result : []
  return {
    rows: JSON.stringify(rows),
    totalCount: String(rows.length),
  }
}

// ----- helpers -----

function requireTable(value: any, field: string): string {
  const t = typeof value === 'string' ? value.trim() : ''
  if (!t) throw new BlockValidationError([{ field, message: 'Select a table.' }])
  return t
}

function coerceBool(v: any): boolean {
  return v === true || v === 'true'
}

function appendRawSuffix(endpoint: string, suffix: string): string {
  if (!suffix) return endpoint
  return endpoint.includes('?') ? `${endpoint}&${suffix}` : `${endpoint}?${suffix}`
}

function compileFilter(args: {
  filterType: 'manual' | 'string'
  filters?: Filter[]
  filterString?: string
  matchType?: MatchType
  fieldName: string
  requireFilter: boolean
}): { qs: Record<string, string>; rawSuffix: string } {
  if (args.filterType === 'string') {
    const raw = (args.filterString ?? '').trim()
    if (args.requireFilter && !raw) {
      throw new BlockValidationError([
        { field: args.fieldName, message: 'A PostgREST filter string is required.' },
      ])
    }
    return { qs: {}, rawSuffix: raw }
  }

  const filters = (args.filters ?? []).filter((f) => f && f.column && f.condition)
  if (args.requireFilter && filters.length === 0) {
    throw new BlockValidationError([
      {
        field: args.fieldName,
        message: 'At least one filter condition is required to avoid affecting all rows.',
      },
    ])
  }
  const matchType = (args.matchType ?? 'allFilters') as MatchType
  return { qs: buildFilterQuery(filters, matchType), rawSuffix: '' }
}


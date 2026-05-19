// src/blocks/supabase/supabase.server.ts

/**
 * Supabase workflow block dispatcher.
 *
 * Translates the block's prefixed-field input shape into the flat input shape
 * each underlying tool expects, calls the tool via `ctx.runTool`, and remaps
 * the tool's structured output back into the block's stringified-JSON output
 * contract so downstream workflow variables keep their existing shape.
 *
 * Dispatch table lives on the block declaration as `toolMap`. See the per-app
 * migration plan §2.5.
 */

import { type Filter, type MatchType } from './shared/build-filter-query'
import { supabaseToolMap } from './tool-map'

type BlockCtx = {
  runTool: (toolId: string, input: Record<string, unknown>) => Promise<Record<string, unknown>>
}

/**
 * Block dispatcher. The lambda runtime injects `ctx.runTool` as the second
 * argument — the SDK's `WorkflowExecuteFunction` type hasn't been widened to
 * reflect that yet, so the export is cast to satisfy the typed slot in
 * `supabase.workflow.tsx`.
 */
async function supabaseExecuteImpl(
  input: Record<string, any>,
  ctx: BlockCtx
): Promise<Record<string, any>> {
  const { resource, operation } = input
  if (!resource || !operation) {
    throw new Error(`Missing resource/operation on supabase block input`)
  }

  const key = `${resource}.${operation}` as keyof typeof supabaseToolMap
  const toolId = supabaseToolMap[key]
  if (!toolId) {
    throw new Error(`Unknown op: ${key}`)
  }

  const toolInput = projectInputsForOp(resource, operation, input)
  const toolOutput = await ctx.runTool(toolId, toolInput)
  return projectOutputsForOp(operation, toolOutput)
}

const supabaseExecute = supabaseExecuteImpl as unknown as (
  input: Record<string, any>
) => Promise<Record<string, any>>

export default supabaseExecute

// --- input projection -------------------------------------------------------

function projectInputsForOp(
  resource: string,
  operation: string,
  input: Record<string, any>
): Record<string, unknown> {
  if (resource !== 'row') {
    throw new Error(`Unhandled resource: ${resource}`)
  }

  switch (operation) {
    case 'create':
      return {
        table: requireString(input.createTable, 'createTable'),
        schema: resolveSchema(input.createCustomSchema, input.createSchema),
        values: fieldsArrayToObject(input.createFields ?? []),
      }
    case 'delete':
      return {
        table: requireString(input.deleteTable, 'deleteTable'),
        schema: resolveSchema(input.deleteCustomSchema, input.deleteSchema),
        ...compileFilterForTool({
          filterType: input.deleteFilterType ?? 'manual',
          filters: input.deleteFilters,
          filterString: input.deleteFilterString,
          matchType: input.deleteMatchType,
          requireFilter: true,
        }),
      }
    case 'get':
      // `row.get` semantics in the block: filter-driven single-row lookup. We
      // delegate to `search_supabase_rows` with a small limit so the existing
      // output contract (`rows` JSON + totalCount) is preserved.
      return {
        table: requireString(input.getTable, 'getTable'),
        schema: resolveSchema(input.getCustomSchema, input.getSchema),
        limit: 1,
        ...compileFilterForTool({
          filterType: input.getFilterType ?? 'manual',
          filters: input.getFilters,
          filterString: input.getFilterString,
          matchType: input.getMatchType,
          requireFilter: true,
        }),
      }
    case 'getMany': {
      const filterType = input.getManyFilterType ?? 'none'
      const limit = Number(input.getManyLimit) || 50
      const filterPart =
        filterType === 'none'
          ? {}
          : compileFilterForTool({
              filterType,
              filters: input.getManyFilters,
              filterString: input.getManyFilterString,
              matchType: input.getManyMatchType,
              requireFilter: false,
            })
      return {
        table: requireString(input.getManyTable, 'getManyTable'),
        schema: resolveSchema(input.getManyCustomSchema, input.getManySchema),
        limit,
        ...filterPart,
      }
    }
    case 'update':
      return {
        table: requireString(input.updateTable, 'updateTable'),
        schema: resolveSchema(input.updateCustomSchema, input.updateSchema),
        values: fieldsArrayToObject(input.updateFields ?? []),
        ...compileFilterForTool({
          filterType: input.updateFilterType ?? 'manual',
          filters: input.updateFilters,
          filterString: input.updateFilterString,
          matchType: input.updateMatchType,
          requireFilter: true,
        }),
      }
    default:
      throw new Error(`Unknown row operation: ${operation}`)
  }
}

// --- output projection ------------------------------------------------------

function projectOutputsForOp(
  operation: string,
  out: Record<string, unknown>
): Record<string, string> {
  switch (operation) {
    case 'create':
      return { row: JSON.stringify(out.row ?? null) }
    case 'delete':
    case 'update': {
      const rows = Array.isArray(out.rows) ? out.rows : []
      return {
        rows: JSON.stringify(rows),
        totalCount: String(typeof out.affectedCount === 'number' ? out.affectedCount : rows.length),
      }
    }
    case 'get': {
      const rows = Array.isArray(out.rows) ? out.rows : []
      return { rows: JSON.stringify(rows), totalCount: String(rows.length) }
    }
    case 'getMany': {
      const rows = Array.isArray(out.rows) ? out.rows : []
      return {
        rows: JSON.stringify(rows),
        totalCount: String(typeof out.totalCount === 'number' ? out.totalCount : rows.length),
        truncated: String(Boolean(out.truncated)),
      }
    }
    default:
      throw new Error(`Unknown row operation: ${operation}`)
  }
}

// --- helpers ----------------------------------------------------------------

function requireString(value: unknown, field: string): string {
  const v = typeof value === 'string' ? value.trim() : ''
  if (!v) throw new Error(`${field} is required`)
  return v
}

function resolveSchema(custom: unknown, schema: unknown): string | undefined {
  if (!custom) return undefined
  return typeof schema === 'string' && schema.trim() ? schema.trim() : 'public'
}

function fieldsArrayToObject(
  fields: Array<{ fieldName?: string; fieldValue?: unknown }>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of fields ?? []) {
    if (!f?.fieldName) continue
    out[f.fieldName] = f.fieldValue
  }
  return out
}

/**
 * Compile block filter fields to the tool's filter shape.
 *
 * Tool inputs expect `{ filters: [...], matchType: 'and' | 'or', rawFilter? }`
 * — we map the block's `manual` / `string` types onto that.
 */
function compileFilterForTool(args: {
  filterType: 'manual' | 'string' | 'none'
  filters?: Filter[]
  filterString?: string
  matchType?: MatchType
  requireFilter: boolean
}): { filters?: unknown[]; matchType?: 'and' | 'or'; rawFilter?: string } {
  if (args.filterType === 'string') {
    const raw = (args.filterString ?? '').trim()
    if (args.requireFilter && !raw) {
      throw new Error('A PostgREST filter string is required.')
    }
    return { filters: [], rawFilter: raw || undefined }
  }

  const filters = (args.filters ?? []).filter((f) => f && f.column && f.condition)
  if (args.requireFilter && filters.length === 0) {
    throw new Error('At least one filter condition is required.')
  }
  const matchType: 'and' | 'or' = args.matchType === 'anyFilter' ? 'or' : 'and'
  return {
    filters: filters.map((f) => ({ column: f.column, op: f.condition, value: f.value ?? '' })),
    matchType,
  }
}

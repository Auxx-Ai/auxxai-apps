// src/blocks/airtable/airtable.server.ts

/**
 * Dispatcher for the Airtable workflow block.
 *
 * The block carries a `toolMap` (see `airtable.workflow.tsx`) keyed by
 * `<resource>.<operation>`. Execution flattens the block's per-op input
 * shape (e.g. `createBase`, `createTable`) into the tool's flat shape and
 * hands off to `runTool`, which the lambda runtime injects on
 * `globalThis.__AUXX_WORKFLOW_SDK__`. See impl plan §6.3 / §7.4.
 */

import { airtableBlockToolMap } from './airtable.workflow'
import { VALID_OPERATIONS } from './resources/constants'

type ToolMapKey = keyof typeof airtableBlockToolMap

/**
 * Project the block's union input shape (one field per resource/op, prefixed
 * with the op name) into the flat shape the underlying tool expects.
 */
function projectInputsForOp(key: ToolMapKey, input: Record<string, any>): Record<string, any> {
  switch (key) {
    case 'base.getMany':
      return {
        returnAll: input.getManyReturnAll,
        limit: input.getManyLimit,
      }
    case 'base.getSchema':
      return {
        baseId: input.getSchemaBase,
      }
    case 'record.create':
      return {
        baseId: input.createBase,
        tableId: input.createTable,
        fields: input.createFields,
        typecast: input.createTypecast,
      }
    case 'record.delete':
      return {
        baseId: input.deleteBase,
        tableId: input.deleteTable,
        recordId: input.deleteRecordId,
      }
    case 'record.get':
      return {
        baseId: input.getBase,
        tableId: input.getTable,
        recordId: input.getRecordId,
      }
    case 'record.search':
      return {
        baseId: input.searchBase,
        tableId: input.searchTable,
        filterFormula: input.searchFilterFormula,
        sortField: input.searchSortField,
        sortDirection: input.searchSortDirection,
        view: input.searchView,
        outputFields: input.searchOutputFields,
        returnAll: input.searchReturnAll,
        limit: input.searchLimit,
      }
    case 'record.update':
      return {
        baseId: input.updateBase,
        tableId: input.updateTable,
        recordId: input.updateRecordId,
        fields: input.updateFields,
        typecast: input.updateTypecast,
      }
    case 'record.upsert':
      return {
        baseId: input.upsertBase,
        tableId: input.upsertTable,
        mergeFields: input.upsertMergeFields,
        fields: input.upsertFields,
        typecast: input.upsertTypecast,
      }
    default: {
      const exhaustive: never = key
      throw new Error(`Unhandled tool-map key: ${exhaustive}`)
    }
  }
}

export default async function airtableExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  const key = `${resource}.${operation}` as ToolMapKey
  const toolId = airtableBlockToolMap[key]
  if (!toolId) throw new Error(`Unknown op: ${key}`)

  const runTool = (globalThis as any).__AUXX_WORKFLOW_SDK__?.runTool as
    | ((toolId: string, input: Record<string, any>) => Promise<Record<string, any>>)
    | undefined
  if (!runTool) {
    throw new Error(
      'Block dispatcher: runTool is not available on the workflow runtime. ' +
        'The lambda runtime must inject globalThis.__AUXX_WORKFLOW_SDK__.runTool.'
    )
  }

  return runTool(toolId, projectInputsForOp(key, input))
}

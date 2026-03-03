// src/blocks/airtable/resources/base/base-schema.ts

/**
 * Base resource input/output field definitions.
 * Operations: Get Many, Get Schema
 */

import { Workflow } from '@auxx/sdk'

export const baseInputs = {
  // --- Base: Get Many ---
  getManyReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Paginate through all results',
    default: false,
  }),
  getManyLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of bases to return',
    default: 100,
    min: 1,
    max: 1000,
  }),

  // --- Base: Get Schema ---
  getSchemaBase: Workflow.select({
    label: 'Base',
    description: 'Select an Airtable base',
    options: [] as { value: string; label: string }[],
  }),
}

export function baseComputeOutputs(operation: string) {
  if (operation === 'getMany') {
    return {
      bases: Workflow.array({
        label: 'Bases',
        items: Workflow.struct({
          id: Workflow.string({ label: 'ID' }),
          name: Workflow.string({ label: 'Name' }),
          permissionLevel: Workflow.string({ label: 'Permission Level' }),
        }),
      }),
      totalCount: Workflow.string({ label: 'Total Count' }),
    }
  }
  if (operation === 'getSchema') {
    return {
      tables: Workflow.array({
        label: 'Tables',
        items: Workflow.struct({
          id: Workflow.string({ label: 'ID' }),
          name: Workflow.string({ label: 'Name' }),
        }),
      }),
      tableCount: Workflow.string({ label: 'Table Count' }),
    }
  }
  return {}
}

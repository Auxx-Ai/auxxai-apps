// src/blocks/supabase/supabase-schema.ts

/**
 * Assembled schema for the Supabase workflow block.
 * Combines row inputs and computes outputs based on operation.
 *
 * Supabase ships one resource (Row) in v1. The resource selector is kept
 * for forward compatibility with Storage / RPC / Auth Users resources.
 */

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS } from './resources/constants'
import { rowInputs, rowComputeOutputs } from './resources/row/row-schema'

export const supabaseSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [{ value: 'row', label: 'Row' }],
      default: 'row',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'create',
    }),

    ...rowInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'row') return rowComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema

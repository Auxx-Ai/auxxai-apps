// src/blocks/airtable/airtable-schema.ts

/**
 * Assembled schema for the Airtable workflow block.
 * Combines all resource inputs and computes outputs based on resource/operation.
 */

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS } from './resources/constants'
import { recordInputs, recordComputeOutputs } from './resources/record/record-schema'
import { baseInputs, baseComputeOutputs } from './resources/base/base-schema'

export const airtableSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [
        { value: 'record', label: 'Record' },
        { value: 'base', label: 'Base' },
      ],
      default: 'record',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'create',
    }),

    ...recordInputs,
    ...baseInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'record') return recordComputeOutputs(operation)
    if (resource === 'base') return baseComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema

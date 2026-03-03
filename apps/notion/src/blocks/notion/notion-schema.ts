// src/blocks/notion/notion-schema.ts

/**
 * Assembled schema for the Notion workflow block.
 * Combines all resource inputs and computes outputs based on resource/operation.
 */

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS } from './resources/constants'
import {
  databasePageInputs,
  databasePageComputeOutputs,
} from './resources/database-page/database-page-schema'
import { pageInputs, pageComputeOutputs } from './resources/page/page-schema'
import { blockInputs, blockComputeOutputs } from './resources/block/block-schema'
import { databaseInputs, databaseComputeOutputs } from './resources/database/database-schema'
import { userInputs, userComputeOutputs } from './resources/user/user-schema'

export const notionSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [
        { value: 'databasePage', label: 'Database Page' },
        { value: 'page', label: 'Page' },
        { value: 'block', label: 'Block' },
        { value: 'database', label: 'Database' },
        { value: 'user', label: 'User' },
      ],
      default: 'databasePage',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'create',
    }),

    ...databasePageInputs,
    ...pageInputs,
    ...blockInputs,
    ...databaseInputs,
    ...userInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'databasePage') return databasePageComputeOutputs(operation)
    if (resource === 'page') return pageComputeOutputs(operation)
    if (resource === 'block') return blockComputeOutputs(operation)
    if (resource === 'database') return databaseComputeOutputs(operation)
    if (resource === 'user') return userComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema

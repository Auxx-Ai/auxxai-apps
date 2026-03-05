// src/blocks/google-sheets/google-sheets-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS } from './resources/constants'
import {
  spreadsheetInputs,
  spreadsheetComputeOutputs,
} from './resources/spreadsheet/spreadsheet-schema'
import { sheetInputs, sheetComputeOutputs } from './resources/sheet/sheet-schema'

export const googleSheetsSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [
        { value: 'spreadsheet', label: 'Spreadsheet' },
        { value: 'sheet', label: 'Sheet' },
      ],
      default: 'sheet',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'getRows',
    }),
    ...spreadsheetInputs,
    ...sheetInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'spreadsheet') return spreadsheetComputeOutputs(operation)
    if (resource === 'sheet') return sheetComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema

// src/triggers/example/example-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

export const exampleTriggerSchema = {
  inputs: {},
  outputs: {
    message: Workflow.string({ label: 'Message' }),
    receivedAt: Workflow.string({ label: 'Received At' }),
  },
} satisfies WorkflowSchema

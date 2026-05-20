// src/blocks/template/template-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

/**
 * Block schema. The block has one selector — `operation` — that switches
 * between the two underlying tools the dispatcher routes to.
 *
 * Real apps usually grow this into a `resource × operation` matrix; see
 * `apps/whatsapp` for the reference shape.
 */
export const templateSchema = {
  inputs: {
    operation: Workflow.select({
      label: 'Operation',
      options: [
        { value: 'echo', label: 'Echo' },
        { value: 'reverse', label: 'Reverse' },
      ],
      default: 'echo',
    }),
    text: Workflow.string({
      label: 'Text',
      placeholder: 'Anything',
    }),
  },
  outputs: {
    text: Workflow.string({ label: 'Text' }),
  },
} satisfies WorkflowSchema

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS } from './resources/constants'
import { contactInputs, contactComputeOutputs } from './resources/contact/contact-schema'

export const googleContactsSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [{ value: 'contact', label: 'Contact' }],
      default: 'contact',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'create',
    }),
    ...contactInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'contact') return contactComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema

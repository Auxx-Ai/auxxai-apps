// src/blocks/twilio/twilio-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS } from './resources/constants'
import { smsInputs, smsComputeOutputs } from './resources/sms/sms-schema'
import { callInputs, callComputeOutputs } from './resources/call/call-schema'

export const twilioSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [
        { value: 'sms', label: 'SMS' },
        { value: 'call', label: 'Call' },
      ],
      default: 'sms',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'send',
    }),
    ...smsInputs,
    ...callInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'sms') return smsComputeOutputs(operation)
    if (resource === 'call') return callComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema

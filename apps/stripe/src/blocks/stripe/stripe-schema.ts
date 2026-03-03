import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS, RESOURCES } from './resources/constants'
import { balanceComputeOutputs, balanceInputs } from './resources/balance/balance-schema'
import { chargeComputeOutputs, chargeInputs } from './resources/charge/charge-schema'
import { couponComputeOutputs, couponInputs } from './resources/coupon/coupon-schema'
import { customerComputeOutputs, customerInputs } from './resources/customer/customer-schema'
import {
  customerCardComputeOutputs,
  customerCardInputs,
} from './resources/customer-card/customer-card-schema'
import { sourceComputeOutputs, sourceInputs } from './resources/source/source-schema'
import { tokenComputeOutputs, tokenInputs } from './resources/token/token-schema'

export const stripeSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [...RESOURCES],
      default: 'customer',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: [...ALL_OPERATIONS],
      default: 'create',
    }),

    ...balanceInputs,
    ...chargeInputs,
    ...couponInputs,
    ...customerInputs,
    ...customerCardInputs,
    ...sourceInputs,
    ...tokenInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    switch (resource) {
      case 'balance':
        return balanceComputeOutputs(operation)
      case 'charge':
        return chargeComputeOutputs(operation)
      case 'coupon':
        return couponComputeOutputs(operation)
      case 'customer':
        return customerComputeOutputs(operation)
      case 'customerCard':
        return customerCardComputeOutputs(operation)
      case 'source':
        return sourceComputeOutputs(operation)
      case 'token':
        return tokenComputeOutputs(operation)
      default:
        return {}
    }
  },
} satisfies WorkflowSchema

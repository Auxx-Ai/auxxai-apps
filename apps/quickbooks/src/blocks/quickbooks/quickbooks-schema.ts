import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { RESOURCES, ALL_OPERATIONS } from './resources/constants'
import { customerInputs, customerComputeOutputs } from './resources/customer/customer-schema'
import { invoiceInputs, invoiceComputeOutputs } from './resources/invoice/invoice-schema'
import { paymentInputs, paymentComputeOutputs } from './resources/payment/payment-schema'
import { estimateInputs, estimateComputeOutputs } from './resources/estimate/estimate-schema'
import { billInputs, billComputeOutputs } from './resources/bill/bill-schema'
import { employeeInputs, employeeComputeOutputs } from './resources/employee/employee-schema'
import { itemInputs, itemComputeOutputs } from './resources/item/item-schema'
import { vendorInputs, vendorComputeOutputs } from './resources/vendor/vendor-schema'
import { purchaseInputs, purchaseComputeOutputs } from './resources/purchase/purchase-schema'
import {
  transactionInputs,
  transactionComputeOutputs,
} from './resources/transaction/transaction-schema'

export const quickbooksSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: RESOURCES as any,
      default: 'customer',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'get',
    }),

    ...customerInputs,
    ...invoiceInputs,
    ...paymentInputs,
    ...estimateInputs,
    ...billInputs,
    ...employeeInputs,
    ...itemInputs,
    ...vendorInputs,
    ...purchaseInputs,
    ...transactionInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    switch (resource) {
      case 'bill':
        return billComputeOutputs(operation)
      case 'customer':
        return customerComputeOutputs(operation)
      case 'employee':
        return employeeComputeOutputs(operation)
      case 'estimate':
        return estimateComputeOutputs(operation)
      case 'invoice':
        return invoiceComputeOutputs(operation)
      case 'item':
        return itemComputeOutputs(operation)
      case 'payment':
        return paymentComputeOutputs(operation)
      case 'purchase':
        return purchaseComputeOutputs(operation)
      case 'transaction':
        return transactionComputeOutputs(operation)
      case 'vendor':
        return vendorComputeOutputs(operation)
      default:
        return {}
    }
  },
} satisfies WorkflowSchema

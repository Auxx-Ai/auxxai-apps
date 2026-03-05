import { VALID_OPERATIONS } from './resources/constants'
import { executeCustomer } from './resources/customer/customer-execute.server'
import { executeInvoice } from './resources/invoice/invoice-execute.server'
import { executePayment } from './resources/payment/payment-execute.server'
import { executeEstimate } from './resources/estimate/estimate-execute.server'
import { executeBill } from './resources/bill/bill-execute.server'
import { executeEmployee } from './resources/employee/employee-execute.server'
import { executeItem } from './resources/item/item-execute.server'
import { executeVendor } from './resources/vendor/vendor-execute.server'
import { executePurchase } from './resources/purchase/purchase-execute.server'
import { executeTransaction } from './resources/transaction/transaction-execute.server'

export default async function quickbooksExecute(
  input: Record<string, any>,
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'bill':
      return executeBill(operation, input)
    case 'customer':
      return executeCustomer(operation, input)
    case 'employee':
      return executeEmployee(operation, input)
    case 'estimate':
      return executeEstimate(operation, input)
    case 'invoice':
      return executeInvoice(operation, input)
    case 'item':
      return executeItem(operation, input)
    case 'payment':
      return executePayment(operation, input)
    case 'purchase':
      return executePurchase(operation, input)
    case 'transaction':
      return executeTransaction(operation, input)
    case 'vendor':
      return executeVendor(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}

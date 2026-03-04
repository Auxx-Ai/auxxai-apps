import { VALID_OPERATIONS } from './resources/constants'
import { executeBalance } from './resources/balance/balance-execute.server'
import { executeCharge } from './resources/charge/charge-execute.server'
import { executeCoupon } from './resources/coupon/coupon-execute.server'
import { executeCustomer } from './resources/customer/customer-execute.server'
import { executeCustomerCard } from './resources/customer-card/customer-card-execute.server'
import { executeSource } from './resources/source/source-execute.server'
import { executeToken } from './resources/token/token-execute.server'

export default async function stripeExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'balance':
      return executeBalance(operation, input)
    case 'charge':
      return executeCharge(operation, input)
    case 'coupon':
      return executeCoupon(operation, input)
    case 'customer':
      return executeCustomer(operation, input)
    case 'customerCard':
      return executeCustomerCard(operation, input)
    case 'source':
      return executeSource(operation, input)
    case 'token':
      return executeToken(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}

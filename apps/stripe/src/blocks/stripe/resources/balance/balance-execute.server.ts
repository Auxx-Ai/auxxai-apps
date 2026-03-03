import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripeApi, throwConnectionNotFound } from '../../shared/stripe-api'

export async function executeBalance(
  operation: string,
  _input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const apiKey = connection.value

  switch (operation) {
    case 'get': {
      const result = await stripeApi<any>('GET', '/balance', apiKey)
      return {
        available: result.available,
        pending: result.pending,
        livemode: String(result.livemode),
      }
    }
    default:
      throw new Error(`Unknown balance operation: ${operation}`)
  }
}

import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripeApi, throwConnectionNotFound } from '../../shared/stripe-api'

export async function executeCustomerCard(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const apiKey = connection.value

  switch (operation) {
    case 'add': {
      const result = await stripeApi<any>(
        'POST',
        `/customers/${input.addCardCustomerId}/sources`,
        apiKey,
        { body: { source: input.addCardToken } }
      )
      return {
        cardId: result.id,
        brand: result.brand ?? '',
        last4: result.last4 ?? '',
        expMonth: String(result.exp_month ?? ''),
        expYear: String(result.exp_year ?? ''),
      }
    }

    case 'get': {
      const result = await stripeApi<any>(
        'GET',
        `/customers/${input.getCardCustomerId}/sources/${input.getCardSourceId}`,
        apiKey
      )
      return {
        cardId: result.id,
        brand: result.brand ?? '',
        last4: result.last4 ?? '',
        expMonth: String(result.exp_month ?? ''),
        expYear: String(result.exp_year ?? ''),
        funding: result.funding ?? '',
      }
    }

    case 'remove': {
      const result = await stripeApi<any>(
        'DELETE',
        `/customers/${input.removeCardCustomerId}/sources/${input.removeCardId}`,
        apiKey
      )
      return {
        cardId: result.id,
        deleted: String(result.deleted ?? true),
      }
    }

    default:
      throw new Error(`Unknown customer card operation: ${operation}`)
  }
}

import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripeApi, throwConnectionNotFound, toStripeMetadata } from '../../shared/stripe-api'

export async function executeSource(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const apiKey = connection.value

  switch (operation) {
    case 'create': {
      const body: Record<string, any> = {
        type: input.createSourceType,
        amount: input.createSourceAmount,
        currency: input.createSourceCurrency,
      }
      if (input.createSourceMetadata?.length) {
        body.metadata = toStripeMetadata(input.createSourceMetadata)
      }

      const source = await stripeApi<any>('POST', '/sources', apiKey, { body })

      // Attach the source to the customer
      await stripeApi<any>('POST', `/customers/${input.createSourceCustomerId}/sources`, apiKey, {
        body: { source: source.id },
      })

      return {
        sourceId: source.id,
        type: source.type ?? '',
        status: source.status ?? '',
        amount: String(source.amount ?? ''),
        currency: source.currency ?? '',
      }
    }

    case 'delete': {
      const result = await stripeApi<any>(
        'DELETE',
        `/customers/${input.deleteSourceCustomerId}/sources/${input.deleteSourceId}`,
        apiKey
      )
      return {
        sourceId: result.id,
        deleted: String(result.deleted ?? true),
      }
    }

    case 'get': {
      const result = await stripeApi<any>('GET', `/sources/${input.getSourceId}`, apiKey)
      return {
        sourceId: result.id,
        type: result.type ?? '',
        status: result.status ?? '',
        amount: String(result.amount ?? ''),
        currency: result.currency ?? '',
      }
    }

    default:
      throw new Error(`Unknown source operation: ${operation}`)
  }
}

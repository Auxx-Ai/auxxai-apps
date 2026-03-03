import { getOrganizationConnection } from '@auxx/sdk/server'
import {
  stripeApi,
  stripePaginatedGet,
  throwConnectionNotFound,
  toStripeMetadata,
} from '../../shared/stripe-api'

export async function executeCharge(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const apiKey = connection.value

  switch (operation) {
    case 'create': {
      const body: Record<string, any> = {
        customer: input.createChargeCustomerId,
        amount: input.createChargeAmount,
        currency: input.createChargeCurrency,
      }
      if (input.createChargeSourceId) body.source = input.createChargeSourceId
      if (input.createChargeDescription) body.description = input.createChargeDescription
      if (input.createChargeReceiptEmail) body.receipt_email = input.createChargeReceiptEmail
      if (input.createChargeMetadata?.length) {
        body.metadata = toStripeMetadata(input.createChargeMetadata)
      }

      const result = await stripeApi<any>('POST', '/charges', apiKey, { body })
      return {
        chargeId: result.id,
        amount: String(result.amount),
        currency: result.currency,
        status: result.status,
        paid: String(result.paid),
        receiptUrl: result.receipt_url ?? '',
      }
    }

    case 'get': {
      const result = await stripeApi<any>('GET', `/charges/${input.getChargeId}`, apiKey)
      return {
        chargeId: result.id,
        amount: String(result.amount),
        currency: result.currency,
        status: result.status,
        paid: String(result.paid),
        customerId: result.customer ?? '',
        description: result.description ?? '',
        receiptUrl: result.receipt_url ?? '',
        metadata: result.metadata ?? {},
      }
    }

    case 'getMany': {
      const { data, truncated } = await stripePaginatedGet(
        '/charges',
        apiKey,
        {},
        {
          returnAll: input.getManyChargesReturnAll ?? false,
          limit: input.getManyChargesLimit ?? 50,
        }
      )
      return {
        charges: data,
        totalCount: String(data.length),
        truncated: String(truncated),
      }
    }

    case 'update': {
      const body: Record<string, any> = {}
      if (input.updateChargeDescription) body.description = input.updateChargeDescription
      if (input.updateChargeReceiptEmail) body.receipt_email = input.updateChargeReceiptEmail
      if (input.updateChargeMetadata?.length) {
        body.metadata = toStripeMetadata(input.updateChargeMetadata)
      }

      const result = await stripeApi<any>('POST', `/charges/${input.updateChargeId}`, apiKey, {
        body,
      })
      return {
        chargeId: result.id,
        amount: String(result.amount),
        status: result.status,
        description: result.description ?? '',
        metadata: result.metadata ?? {},
      }
    }

    default:
      throw new Error(`Unknown charge operation: ${operation}`)
  }
}

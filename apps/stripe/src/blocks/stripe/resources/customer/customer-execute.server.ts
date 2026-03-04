import { getOrganizationConnection } from '@auxx/sdk/server'
import {
  stripeApi,
  stripePaginatedGet,
  throwConnectionNotFound,
  toStripeMetadata,
} from '../../shared/stripe-api'

export async function executeCustomer(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const apiKey = connection.value

  switch (operation) {
    case 'create': {
      const body: Record<string, any> = { name: input.createCustomerName }
      if (input.createCustomerEmail) body.email = input.createCustomerEmail
      if (input.createCustomerPhone) body.phone = input.createCustomerPhone
      if (input.createCustomerDescription) body.description = input.createCustomerDescription
      if (input.createCustomerMetadata?.length) {
        body.metadata = toStripeMetadata(input.createCustomerMetadata)
      }
      if (input.createCustomerAddressLine1) {
        body.address = {
          line1: input.createCustomerAddressLine1,
          line2: input.createCustomerAddressLine2 || undefined,
          city: input.createCustomerAddressCity || undefined,
          state: input.createCustomerAddressState || undefined,
          country: input.createCustomerAddressCountry || undefined,
          postal_code: input.createCustomerAddressPostalCode || undefined,
        }
      }

      const result = await stripeApi<any>('POST', '/customers', apiKey, { body })
      return {
        customerId: result.id,
        name: result.name ?? '',
        email: result.email ?? '',
        phone: result.phone ?? '',
        description: result.description ?? '',
        metadata: result.metadata ?? {},
        created: String(result.created),
      }
    }

    case 'delete': {
      const result = await stripeApi<any>('DELETE', `/customers/${input.deleteCustomerId}`, apiKey)
      return { customerId: result.id, deleted: String(result.deleted) }
    }

    case 'get': {
      const result = await stripeApi<any>('GET', `/customers/${input.getCustomerId}`, apiKey)
      return {
        customerId: result.id,
        name: result.name ?? '',
        email: result.email ?? '',
        phone: result.phone ?? '',
        description: result.description ?? '',
        metadata: result.metadata ?? {},
        created: String(result.created),
        defaultSource: result.default_source ?? '',
      }
    }

    case 'getMany': {
      const qs: Record<string, string> = {}
      if (input.getManyCustomersEmail) qs.email = input.getManyCustomersEmail
      const { data, truncated } = await stripePaginatedGet('/customers', apiKey, qs, {
        returnAll: input.getManyCustomersReturnAll ?? false,
        limit: input.getManyCustomersLimit ?? 50,
      })
      return {
        customers: data,
        totalCount: String(data.length),
        truncated: String(truncated),
      }
    }

    case 'update': {
      const body: Record<string, any> = {}
      if (input.updateCustomerName) body.name = input.updateCustomerName
      if (input.updateCustomerEmail) body.email = input.updateCustomerEmail
      if (input.updateCustomerPhone) body.phone = input.updateCustomerPhone
      if (input.updateCustomerDescription) body.description = input.updateCustomerDescription
      if (input.updateCustomerMetadata?.length) {
        body.metadata = toStripeMetadata(input.updateCustomerMetadata)
      }
      if (input.updateCustomerAddressLine1) {
        body.address = {
          line1: input.updateCustomerAddressLine1,
          line2: input.updateCustomerAddressLine2 || undefined,
          city: input.updateCustomerAddressCity || undefined,
          state: input.updateCustomerAddressState || undefined,
          country: input.updateCustomerAddressCountry || undefined,
          postal_code: input.updateCustomerAddressPostalCode || undefined,
        }
      }

      const result = await stripeApi<any>('POST', `/customers/${input.updateCustomerId}`, apiKey, {
        body,
      })
      return {
        customerId: result.id,
        name: result.name ?? '',
        email: result.email ?? '',
        metadata: result.metadata ?? {},
      }
    }

    default:
      throw new Error(`Unknown customer operation: ${operation}`)
  }
}

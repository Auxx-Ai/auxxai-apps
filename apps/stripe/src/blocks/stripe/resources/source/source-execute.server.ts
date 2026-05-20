// src/blocks/stripe/resources/source/source-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripeApi, throwConnectionNotFound, toStripeMetadata } from '../../shared/stripe-api'

function getApiKey(): string {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}

export async function sourceCreate(input: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = getApiKey()
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

export async function sourceDelete(input: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = getApiKey()
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

export async function sourceGet(input: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = getApiKey()
  const result = await stripeApi<any>('GET', `/sources/${input.getSourceId}`, apiKey)
  return {
    sourceId: result.id,
    type: result.type ?? '',
    status: result.status ?? '',
    amount: String(result.amount ?? ''),
    currency: result.currency ?? '',
  }
}

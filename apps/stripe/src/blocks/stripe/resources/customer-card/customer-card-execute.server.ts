// src/blocks/stripe/resources/customer-card/customer-card-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripeApi, throwConnectionNotFound } from '../../shared/stripe-api'

function getApiKey(): string {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}

export async function customerCardAdd(input: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = getApiKey()
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

export async function customerCardGet(input: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = getApiKey()
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

export async function customerCardRemove(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const apiKey = getApiKey()
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

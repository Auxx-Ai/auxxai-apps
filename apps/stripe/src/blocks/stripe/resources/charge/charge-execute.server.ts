// src/blocks/stripe/resources/charge/charge-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import {
  stripeApi,
  stripePaginatedGet,
  throwConnectionNotFound,
  toStripeMetadata,
} from '../../shared/stripe-api'

function getApiKey(): string {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}

export async function chargeCreate(input: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = getApiKey()
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

export async function chargeGet(input: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = getApiKey()
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

export async function chargeGetMany(input: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = getApiKey()
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

export async function chargeUpdate(input: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = getApiKey()
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

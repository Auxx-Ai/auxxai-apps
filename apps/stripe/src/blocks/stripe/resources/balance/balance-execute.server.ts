// src/blocks/stripe/resources/balance/balance-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripeApi, throwConnectionNotFound } from '../../shared/stripe-api'

function getApiKey(): string {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}

export async function balanceGet(_input: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = getApiKey()
  const result = await stripeApi<any>('GET', '/balance', apiKey)
  return {
    available: result.available,
    pending: result.pending,
    livemode: String(result.livemode),
  }
}

// src/blocks/stripe/resources/token/token-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripeApi, throwConnectionNotFound } from '../../shared/stripe-api'

function getApiKey(): string {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}

export async function tokenCreate(input: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = getApiKey()
  const body: Record<string, any> = {
    card: {
      number: input.createTokenCardNumber,
      exp_month: input.createTokenExpMonth,
      exp_year: input.createTokenExpYear,
      cvc: input.createTokenCvc,
    },
  }

  const result = await stripeApi<any>('POST', '/tokens', apiKey, { body })
  return {
    tokenId: result.id,
    type: result.type ?? '',
    cardId: result.card?.id ?? '',
    cardBrand: result.card?.brand ?? '',
    cardLast4: result.card?.last4 ?? '',
  }
}

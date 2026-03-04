import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripeApi, throwConnectionNotFound } from '../../shared/stripe-api'

export async function executeToken(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const apiKey = connection.value

  switch (operation) {
    case 'create': {
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

    default:
      throw new Error(`Unknown token operation: ${operation}`)
  }
}

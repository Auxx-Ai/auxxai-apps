// src/tools/shared/map-stripe-card.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export type CardFunding = 'credit' | 'debit' | 'prepaid' | 'unknown'

export interface MappedStripeCard {
  cardId: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  funding: CardFunding
  isDefault: boolean
}

/**
 * @param customer The parent customer object (used to compute isDefault by
 * comparing card.id against customer.default_source).
 */
export function mapStripeCard(raw: any, customer?: any): MappedStripeCard {
  const defaultSourceId =
    typeof customer?.default_source === 'string'
      ? customer.default_source
      : (customer?.default_source?.id ?? null)
  return {
    cardId: raw.id,
    brand: raw.brand ?? '',
    last4: raw.last4 ?? '',
    expMonth: Number(raw.exp_month ?? 0),
    expYear: Number(raw.exp_year ?? 0),
    funding: (raw.funding as CardFunding) ?? 'unknown',
    isDefault: defaultSourceId !== null && raw.id === defaultSourceId,
  }
}

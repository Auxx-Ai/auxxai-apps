// src/tools/shared/map-stripe-customer.ts

/**
 * Stripe customer object → tool-shaped object. Distinct from the
 * workflow block's mapper, which returns flat-stringified JSON
 * (`metadata: JSON.stringify(...)`) for variable splicing. The tool
 * mapper keeps the structure typed.
 *
 * The mapper itself doesn't resolve the contact ref — callers are
 * expected to merge `auxxRecordId` from `resolveContactRef(ctx, id)`.
 * Keeping the ref-resolve out of the mapper means list-shaped tools
 * can resolve refs in one pass over the page (or skip it entirely
 * when the input pins one customer already).
 *
 * See plans/kopilot/apps/stripe-overhaul.md §7.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MappedStripeCustomer {
  stripeCustomerId: string
  email: string | null
  name: string | null
  phone: string | null
  description: string | null
  delinquent: boolean
  defaultSource: string | null
  address: MappedAddress | null
  metadata: Record<string, string>
  created: string
  livemode: boolean
}

export interface MappedAddress {
  line1: string | null
  line2: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
}

function isoFromUnix(seconds: number | null | undefined): string {
  if (!seconds) return new Date(0).toISOString()
  return new Date(seconds * 1000).toISOString()
}

function mapAddress(addr: any): MappedAddress | null {
  if (!addr) return null
  return {
    line1: addr.line1 ?? null,
    line2: addr.line2 ?? null,
    city: addr.city ?? null,
    state: addr.state ?? null,
    country: addr.country ?? null,
    postalCode: addr.postal_code ?? null,
  }
}

export function mapStripeCustomer(raw: any): MappedStripeCustomer {
  return {
    stripeCustomerId: raw.id,
    email: raw.email ?? null,
    name: raw.name ?? null,
    phone: raw.phone ?? null,
    description: raw.description ?? null,
    delinquent: Boolean(raw.delinquent),
    defaultSource: typeof raw.default_source === 'string' ? raw.default_source : null,
    address: mapAddress(raw.address),
    metadata: (raw.metadata ?? {}) as Record<string, string>,
    created: isoFromUnix(raw.created),
    livemode: Boolean(raw.livemode),
  }
}

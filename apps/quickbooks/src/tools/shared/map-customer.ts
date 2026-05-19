// src/tools/shared/map-customer.ts

/**
 * Raw QuickBooks Customer → tool-shaped object. Separate from the
 * workflow block's flat-stringified mapper (see
 * plans/kopilot/apps/quickbooks-overhaul.md §7.3).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MappedCustomerSummary {
  customerId: string
  displayName: string
  email: string | null
  phone: string | null
  companyName: string | null
  balance: number
  active: boolean
}

export interface MappedCustomerDetail extends MappedCustomerSummary {
  givenName: string | null
  familyName: string | null
  billingAddress: MappedAddress | null
  taxable: boolean | null
  preferredDeliveryMethod: string | null
  syncToken: string
}

export interface MappedAddress {
  line1: string | null
  city: string | null
  postalCode: string | null
  state: string | null
}

function mapAddress(addr: any): MappedAddress | null {
  if (!addr) return null
  const line1 = addr.Line1 ?? null
  const city = addr.City ?? null
  const postalCode = addr.PostalCode ?? null
  const state = addr.CountrySubDivisionCode ?? null
  if (!line1 && !city && !postalCode && !state) return null
  return { line1, city, postalCode, state }
}

export function mapCustomerSummary(c: any): MappedCustomerSummary {
  return {
    customerId: String(c.Id ?? ''),
    displayName: c.DisplayName ?? '',
    email: c.PrimaryEmailAddr?.Address ?? null,
    phone: c.PrimaryPhone?.FreeFormNumber ?? null,
    companyName: c.CompanyName ?? null,
    balance: Number(c.Balance ?? 0),
    active: c.Active !== false,
  }
}

export function mapCustomerDetail(c: any): MappedCustomerDetail {
  return {
    ...mapCustomerSummary(c),
    givenName: c.GivenName ?? null,
    familyName: c.FamilyName ?? null,
    billingAddress: mapAddress(c.BillAddr),
    taxable: typeof c.Taxable === 'boolean' ? c.Taxable : null,
    preferredDeliveryMethod: c.PreferredDeliveryMethod ?? null,
    syncToken: String(c.SyncToken ?? '0'),
  }
}

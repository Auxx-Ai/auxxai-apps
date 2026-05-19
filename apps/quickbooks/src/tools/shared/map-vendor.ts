// src/tools/shared/map-vendor.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { type MappedAddress } from './map-customer'

export interface MappedVendorSummary {
  vendorId: string
  displayName: string
  email: string | null
  phone: string | null
  companyName: string | null
  balance: number
  active: boolean
}

export interface MappedVendorDetail extends MappedVendorSummary {
  givenName: string | null
  familyName: string | null
  billingAddress: MappedAddress | null
  acctNum: string | null
  vendor1099: boolean | null
  syncToken: string
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

export function mapVendorSummary(v: any): MappedVendorSummary {
  return {
    vendorId: String(v.Id ?? ''),
    displayName: v.DisplayName ?? '',
    email: v.PrimaryEmailAddr?.Address ?? null,
    phone: v.PrimaryPhone?.FreeFormNumber ?? null,
    companyName: v.CompanyName ?? null,
    balance: Number(v.Balance ?? 0),
    active: v.Active !== false,
  }
}

export function mapVendorDetail(v: any): MappedVendorDetail {
  return {
    ...mapVendorSummary(v),
    givenName: v.GivenName ?? null,
    familyName: v.FamilyName ?? null,
    billingAddress: mapAddress(v.BillAddr),
    acctNum: v.AcctNum ?? null,
    vendor1099: typeof v.Vendor1099 === 'boolean' ? v.Vendor1099 : null,
    syncToken: String(v.SyncToken ?? '0'),
  }
}

// src/graphql/customer.ts

import type { RawCustomer } from '../shopify.connector.server'
import { legacyId } from './legacy-id'
import type { GraphqlConnection } from './paged'

/** Customers page, oldest update first (plan §6.4). */
export const CUSTOMERS_QUERY = `query CustomersPage($first: Int!, $after: String, $query: String) {
  customers(first: $first, after: $after, query: $query, sortKey: UPDATED_AT) {
    pageInfo { hasNextPage endCursor }
    nodes {
      legacyResourceId firstName lastName note createdAt updatedAt taxExempt
      defaultEmailAddress { emailAddress } defaultPhoneNumber { phoneNumber }
      numberOfOrders amountSpent { amount }
      defaultAddress { address1 address2 city province zip country }
    }
  }
}`

export interface GqlAddress {
  address1?: string | null
  address2?: string | null
  city?: string | null
  province?: string | null
  zip?: string | null
  country?: string | null
}

export interface GqlCustomer {
  legacyResourceId: string
  firstName?: string | null
  lastName?: string | null
  note?: string | null
  createdAt: string
  updatedAt: string
  taxExempt?: boolean | null
  defaultEmailAddress?: { emailAddress?: string | null } | null
  defaultPhoneNumber?: { phoneNumber?: string | null } | null
  /** An `UnsignedInt64`, serialised as a string. */
  numberOfOrders: string | number
  amountSpent?: { amount?: string | null } | null
  defaultAddress?: GqlAddress | null
}

export interface CustomersData {
  customers: GraphqlConnection<GqlCustomer>
}

function orderCount(value: unknown): number {
  const n = typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value) ? Number(value) : value
  if (typeof n === 'number' && Number.isSafeInteger(n) && n >= 0) return n
  throw new Error(`shopify: customer numberOfOrders is not a safe count: ${String(value)}`)
}

/** Adapt a GraphQL customer into the REST shape `toCustomerRecord` projects. */
export function toRawCustomer(node: GqlCustomer): RawCustomer {
  const amount = node.amountSpent?.amount
  if (typeof amount !== 'string') throw new Error('shopify: customer amountSpent is missing')
  const addr = node.defaultAddress
  return {
    id: legacyId(node.legacyResourceId),
    email: node.defaultEmailAddress?.emailAddress ?? null,
    first_name: node.firstName ?? null,
    last_name: node.lastName ?? null,
    phone: node.defaultPhoneNumber?.phoneNumber ?? null,
    orders_count: orderCount(node.numberOfOrders),
    total_spent: amount,
    note: node.note ?? null,
    created_at: node.createdAt,
    updated_at: node.updatedAt,
    default_address: addr
      ? {
          address1: addr.address1 ?? null,
          address2: addr.address2 ?? null,
          city: addr.city ?? null,
          province: addr.province ?? null,
          zip: addr.zip ?? null,
          country: addr.country ?? null,
        }
      : null,
    tax_exempt: node.taxExempt ?? null,
  }
}

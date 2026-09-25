// apps/shopify/tests/graphql-customer.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest'
import { type GqlCustomer, toRawCustomer } from '../src/graphql/customer'
import shopifySync from '../src/shopify.connector.server'
import { connection, stubGraphql } from './graphql-test-support'

const customer: GqlCustomer = {
  legacyResourceId: '7001',
  firstName: 'Test',
  lastName: 'Buyer',
  note: 'dealer',
  createdAt: '2025-01-02T03:04:05Z',
  updatedAt: '2026-09-01T00:00:00Z',
  taxExempt: true,
  defaultEmailAddress: { emailAddress: 'buyer@example.com' },
  defaultPhoneNumber: { phoneNumber: '+15550000000' },
  numberOfOrders: '12',
  amountSpent: { amount: '1234.10' },
  defaultAddress: {
    address1: '1 Test St',
    address2: null,
    city: 'Testville',
    province: 'Oregon',
    zip: '97000',
    country: 'United States',
  },
}

afterEach(() => vi.unstubAllGlobals())

describe('toRawCustomer', () => {
  it('adapts a GraphQL customer into the REST shape', () => {
    expect(toRawCustomer(customer)).toEqual({
      id: 7001,
      email: 'buyer@example.com',
      first_name: 'Test',
      last_name: 'Buyer',
      phone: '+15550000000',
      orders_count: 12,
      total_spent: '1234.10',
      note: 'dealer',
      created_at: '2025-01-02T03:04:05Z',
      updated_at: '2026-09-01T00:00:00Z',
      default_address: {
        address1: '1 Test St',
        address2: null,
        city: 'Testville',
        province: 'Oregon',
        zip: '97000',
        country: 'United States',
      },
      tax_exempt: true,
    })
  })

  it('nulls missing email, phone, address and tax flag', () => {
    const raw = toRawCustomer({
      ...customer,
      defaultEmailAddress: null,
      defaultPhoneNumber: null,
      defaultAddress: null,
      taxExempt: undefined,
      firstName: undefined,
    })
    expect(raw).toMatchObject({
      email: null,
      phone: null,
      default_address: null,
      tax_exempt: null,
      first_name: null,
    })
  })

  it('rejects a non-count numberOfOrders', () => {
    for (const bad of ['-1', '1.5', '', 'abc', '9007199254740993']) {
      expect(() => toRawCustomer({ ...customer, numberOfOrders: bad })).toThrow('numberOfOrders')
    }
    expect(toRawCustomer({ ...customer, numberOfOrders: '0' }).orders_count).toBe(0)
  })

  it('rejects an unsafe legacyResourceId', () => {
    expect(() => toRawCustomer({ ...customer, legacyResourceId: '9007199254740993' })).toThrow()
    expect(() =>
      toRawCustomer({ ...customer, legacyResourceId: 'gid://shopify/Customer/1' })
    ).toThrow()
  })

  it('passes the amount through verbatim', () => {
    const raw = toRawCustomer({ ...customer, amountSpent: { amount: '0.10000' } })
    expect(raw.total_spent).toBe('0.10000')
  })
})

describe('shopifySync customer stream', () => {
  it('fetches one GraphQL page and projects the contact record', async () => {
    const calls = stubGraphql([
      {
        body: {
          data: {
            customers: {
              nodes: [customer],
              pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
            },
          },
        },
      },
    ])
    const result = await shopifySync({
      streamKey: 'customer',
      query: { since: '2026-08-01T00:00:00Z' },
      config: {},
      connection,
    })

    expect(calls).toHaveLength(1)
    expect(calls[0]!.url).toBe('https://test-shop.myshopify.com/admin/api/2026-07/graphql.json')
    expect(calls[0]!.body.query).toContain('customers(first: $first')
    expect(calls[0]!.body.query).toContain('sortKey: UPDATED_AT')
    expect(calls[0]!.body.variables).toEqual({
      first: 250,
      after: null,
      query: "updated_at:>='2026-08-01T00:00:00.000Z'",
    })
    expect(result.records).toEqual([
      {
        streamKey: 'customer',
        externalId: '7001',
        displayName: 'buyer@example.com',
        fields: {
          id: '7001',
          email: 'buyer@example.com',
          first_name: 'Test',
          last_name: 'Buyer',
          phone: '+15550000000',
          orders_count: 12,
          total_spent: '1234.10',
          note: 'dealer',
          created_at: '2025-01-02T03:04:05Z',
          tax_exempt: true,
          default_address: { city: 'Testville', province: 'Oregon', country: 'United States' },
        },
      },
    ])
    expect(result.cursor).toEqual({ v: 3, after: 'cursor-1' })
    expect(result.since).toBeUndefined()
  })
})

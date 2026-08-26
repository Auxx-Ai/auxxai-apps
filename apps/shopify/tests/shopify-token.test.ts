// tests/shopify-token.test.ts

import { describe, expect, it } from 'vitest'
import { getShopifyToken } from '../src/blocks/shopify/shared/shopify-api'

/**
 * The platform stores the Shopify Admin token in a different place per connection
 * method, and the SDK's `value` resolver never reads `fields`:
 *
 *   OAuth (`oauth2-code`)                  -> secrets.accessToken   -> value is the token
 *   API Key (`secret`, shop + api_key)     -> secrets.fields.api_key -> value is ''
 */
describe('getShopifyToken', () => {
  it('returns value for an OAuth connection (no fields present)', () => {
    expect(getShopifyToken({ value: 'shpat_oauth' })).toBe('shpat_oauth')
  })

  it('falls back to fields.api_key for an API-Key connection (empty value)', () => {
    expect(
      getShopifyToken({ value: '', fields: { shop: 'auxxai', api_key: 'shpat_apikey' } })
    ).toBe('shpat_apikey')
  })

  it('falls back to fields.api_key when value is absent entirely', () => {
    expect(getShopifyToken({ fields: { api_key: 'shpat_apikey' } })).toBe('shpat_apikey')
  })

  it('prefers value over fields.api_key when both are set (OAuth precedence)', () => {
    expect(getShopifyToken({ value: 'shpat_oauth', fields: { api_key: 'shpat_apikey' } })).toBe(
      'shpat_oauth'
    )
  })

  it('returns empty string when neither is set', () => {
    expect(getShopifyToken({})).toBe('')
    expect(getShopifyToken({ value: '', fields: {} })).toBe('')
  })

  it('returns empty string for an undefined or null connection', () => {
    expect(getShopifyToken(undefined)).toBe('')
    expect(getShopifyToken(null)).toBe('')
  })

  it('ignores unrelated fields — only the agreed api_key contract is read', () => {
    expect(getShopifyToken({ value: '', fields: { shop: 'auxxai', apiKey: 'wrong-key' } })).toBe('')
  })
})

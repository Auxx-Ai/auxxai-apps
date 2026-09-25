// tests/affirm-manifest.test.ts
//
// The connector MANIFEST — the two stream declarations, and the promise that
// what the connector emits is what the platform's connector path accepts.
//
// The entry assertions run the PLATFORM's own `processorRecordEntrySchema`
// from `packages/lib/src/money/payouts/record-contracts.ts`, imported across
// the repo boundary via a vitest alias. That schema — NOT the `.strict()`
// `processorBalanceEvidenceSchema` the evidence path uses — is the one the
// connector is validated against, and it is where `providerType` is declared.
// A copy of it here would drift; this cannot.

import { processorRecordEntrySchema } from '@auxx/lib/money/payouts/record-contracts'
import { payoutFieldMappings, processorFieldMappings } from '@auxx/sdk/financial-source'
import { existsSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { affirmConnector } from '../src/affirm.connector'
import { fetchAffirmStream } from '../src/affirm.connector.server'

const stream = (key: string) => affirmConnector.streams.find((s) => s.key === key)!

describe('the two streams', () => {
  it('declares exactly two, both period-bounded rescans', () => {
    expect(affirmConnector.streams.map((s) => s.key)).toEqual(['payout', 'balance_transaction'])
    expect(affirmConnector.streams.map((s) => s.query)).toEqual([
      { period: 'issuedOn' },
      { period: 'transactionDate' },
    ])
    expect(affirmConnector.requiresConnection).toBe(true)
  })

  it('fans a payout onto the native payout and processor_balance_entry kinds', () => {
    const [root, members] = stream('payout').mappings

    expect(root).toMatchObject({ rootPath: '', target: { entityKind: 'payout' } })
    expect(members).toMatchObject({
      rootPath: 'processorTransactions[]',
      target: { entityKind: 'processor_balance_entry' },
      relationshipFieldKey: 'system:payout_processor_entries',
    })
    // The SDK's shared lists, by identity — imported, never copied, so Affirm
    // and Shopify Payments cannot drift apart in what they emit.
    expect(root!.fields).toBe(payoutFieldMappings)
    expect(members!.fields).toBe(processorFieldMappings)
  })

  it('emits standalone processor entries from its second stream', () => {
    const mappings = stream('balance_transaction').mappings
    expect(mappings).toHaveLength(1)
    expect(mappings[0]).toMatchObject({
      rootPath: '',
      target: { entityKind: 'processor_balance_entry' },
    })
    expect(mappings[0]!.fields).toBe(processorFieldMappings)
  })

  it('declares NO entities and NO app fields of its own', () => {
    // Affirm contributes into the NATIVE payout / processor_balance_entry
    // kinds; it owns no record model. ShipStation had to make this correction
    // after the fact, so the two scaffold files are asserted GONE rather than
    // merely unreferenced — an unused `defineEntity` still provisions a
    // definition on install.
    const src = new URL('../src/', import.meta.url)
    expect(existsSync(new URL('entities.ts', src))).toBe(false)
    expect(existsSync(new URL('fields.ts', src))).toBe(false)
    // Every mapping targets an `entityKind`, never an app-owned `entityKey`.
    for (const stream of affirmConnector.streams) {
      for (const mapping of stream.mappings) {
        expect(mapping.target).toHaveProperty('entityKind')
        expect(mapping.target).not.toHaveProperty('entityKey')
      }
    }
  })

  it('maps providerType, which the connector path declares and the evidence path does not', () => {
    expect(processorFieldMappings).toContainEqual({
      sourcePath: 'providerType',
      target: 'processor_balance_provider_type',
    })
  })
})

describe('exampleRecord is the real deposit', () => {
  // ✔ Both raw rows in `affirm.connector.ts` are VERBATIM public-API responses
  // from the 2026-09-16 probe, so the catalog preview shows what Affirm
  // actually returns — envelope vocabulary, ids, `effective_date` and all.
  it('shows the true Sep 15 Affirm payload on the payout stream', () => {
    const example = stream('payout').exampleRecord as Record<string, any>

    expect(example.externalId).toBe('I5Y8PHAWWSSS2WJ')
    expect(example.providerKey).toBe('affirm')
    expect(example.externalAccountId).toBe('07JVNWWI5PZM8L7Y')
    expect(example.amount).toBe('3579.30')
    expect(example.issuedOn).toBe('2026-09-15')
    expect(example.raw.total_settled).toBe(357930)
    // The daily feed's own vocabulary: `total_sales` / `total_fees`, not the
    // event feed's `sales` / `fees`.
    expect(example.raw.total_sales).toBe(374005)
    expect(example.raw.total_fees).toBe(-16075)
    // ✔ The PUBLIC API's spelling. The merchant portal says `loan_captured`.
    expect(example.membership.entries[0].providerType).toBe('loan_capture')
    expect(example.membership.entries[0].sourceOrderId).toBe('rPhjzMna9vESRYlOF0hLADbBL')
    // fee = -(-16075). `transaction_fees: -30` is a component OF that fee and
    // is NOT added to it; the preview would otherwise show 161.05 / 3740.35.
    expect(example.membership.entries[0].fee).toBe('160.75')
    expect(example.membership.entries[0].gross).toBe('3740.05')
    expect(example.membership.rawRows[0].transaction_fees).toBe(-30)
    // The entry is dated by its own `effective_date`; the deposit's date-only
    // settlement date stays on the header.
    expect(example.membership.entries[0].transactionDate).toBe('2026-09-14T19:28:14Z')
    // ✔ The public API sends `account_last_four`; the portal's JSON did not.
    expect(example.destinationExternalId).toBe('6670')
    // The fan-out the child mapping reads.
    expect(example.processorTransactions).toHaveLength(1)
    expect(example.processorTransactions[0].sourceKey).toBe(
      JSON.stringify(['affirm', '07JVNWWI5PZM8L7Y', 'live', '53f9cad7-b293-4918-b7d4-6716c64e21de'])
    )
  })

  it('satisfies the platform’s own entry schema on both streams', () => {
    const payoutExample = stream('payout').exampleRecord as Record<string, any>
    expect(() =>
      processorRecordEntrySchema.parse(payoutExample.membership.entries[0])
    ).not.toThrow()

    const balanceExample = stream('balance_transaction').exampleRecord as Record<string, any>
    // The balance example is a flat projection, so the entry members are spread
    // onto it. Pull the contract's own keys back out and parse those.
    expect(() =>
      processorRecordEntrySchema.parse({
        id: balanceExample.id,
        type: balanceExample.type,
        providerType: balanceExample.providerType,
        gross: balanceExample.gross,
        fee: balanceExample.fee,
        net: balanceExample.net,
        currency: balanceExample.currency,
        currencyExponent: balanceExample.currencyExponent,
        transactionDate: balanceExample.transactionDate,
        payoutId: balanceExample.payoutId,
        sourceTransactionId: balanceExample.sourceTransactionId,
        sourceOrderId: balanceExample.sourceOrderId,
        sourceId: balanceExample.sourceId,
        sourceType: balanceExample.sourceType,
        sourceReference: balanceExample.sourceReference,
        raw: balanceExample.raw,
      })
    ).not.toThrow()
  })
})

describe('what the connector actually emits', () => {
  let responses: Response[] = []

  beforeEach(() => {
    responses = []
    globalThis.fetch = (async () => {
      const next = responses.shift()
      if (!next) throw new Error('Unexpected Affirm request')
      return next
    }) as typeof fetch
  })

  it('produces membership entries the platform schema accepts', async () => {
    // ✔ A verbatim `GET /settlements/events` response: the `data` envelope, the
    // real row, integer minor units.
    responses.push(
      new Response(
        JSON.stringify({
          data: [
            {
              order_id: 'rPhjzMna9vESRYlOF0hLADbBL',
              merchant_id: '07JVNWWI5PZM8L7Y',
              channel: 'Affirm Direct',
              deposit_id: 'I5Y8PHAWWSSS2WJ',
              initiating_merchant_id: '07JVNWWI5PZM8L7Y',
              mdr: 0.0429,
              date: '2026-09-15',
              total_settled: 357930,
              effective_date: '2026-09-14T19:28:14Z',
              id: '53f9cad7-b293-4918-b7d4-6716c64e21de',
              transaction_id: 'oTzSBZG2TU5WGc28',
              event_type: 'loan_capture',
              transaction_fees: -30,
              original_loan_amount: 374005,
              sales: 374005,
              charge_created_date: '2026-09-14',
              refunds: 0,
              transaction_event_id: 'DUUX0OUUPNABFT9G',
              fees: -16075,
              purchase_id: 'CPDZ-ANRU',
              currency: 'USD',
            },
          ],
          next_page: null,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    const result = await fetchAffirmStream({
      streamKey: 'payout',
      query: {},
      connection: {
        value: '',
        fields: { merchant_id: '07JVNWWI5PZM8L7Y', public_key: 'p', private_key: 's' },
      },
      config: {},
      cursor: {
        version: 1,
        streamKey: 'payout',
        scanId: 'scan',
        startedAt: '2026-09-15T00:00:00Z',
        phase: 'members',
        merchantId: '07JVNWWI5PZM8L7Y',
        pageIndex: 0,
        headerIndex: 0,
        summary: {
          deposit_id: 'I5Y8PHAWWSSS2WJ',
          date: '2026-09-15',
          total_settled: 357930,
          currency: 'USD',
        },
        window: { after: '2026-09-14', before: '2026-09-16' },
      },
    })

    const record = (result.records as { fields: Record<string, any> }[])[0]!
    for (const entry of record.fields.membership.entries) {
      expect(() => processorRecordEntrySchema.parse(entry)).not.toThrow()
    }
    expect(record.fields.membership.entries[0].providerType).toBe('loan_capture')
    expect(record.fields.membership.entries[0].fee).toBe('160.75')
    expect(record.fields.membership.entries[0].transactionDate).toBe('2026-09-14T19:28:14Z')
  })
})

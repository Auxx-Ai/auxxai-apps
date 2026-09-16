// tests/affirm-block.test.ts
//
// The `affirm` workflow block. Four things are being protected here:
//
//   1. Every advertised (resource, operation) pair dispatches to a tool that
//      ACTUALLY EXISTS. A typo in the tool map is invisible until run time,
//      where it surfaces as `Tool not found` on a node the panel happily
//      offered — the same hole `operation-surface.test.ts` was written for in
//      the ShipStation app.
//   2. The block stays READ-ONLY. Capture, refund and void are build plan §7,
//      behind their own fence, against a live lender with no sandbox.
//   3. `charge.get` publishes the Shopify PaymentSession id as a first-class
//      output variable. That is how an Affirm settlement is tied back to a
//      Shopify order (build plan §6), and it is the single most useful thing
//      this block hands a downstream node.
//   4. It does not widen what `get_affirm_charge` deliberately withholds. That
//      tool projects only `checkout.metadata` off an expanded Affirm checkout,
//      never `billing`, `shipping` or the customer, and `affirm-tools.test.ts`
//      asserts it. The block's allowlist projection must not undo that.
//
// Every fixture below is the real 2026-09-16 probe payload: deposit
// `I5Y8PHAWWSSS2WJ`, 2026-09-15, `total_settled` 357930 minor units → the exact
// decimal `3579.30`, charge `CPDZ-ANRU`, order `rPhjzMna9vESRYlOF0hLADbBL`.
// Nothing in this file divides by 100.

import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  affirmComputeOutputs,
  affirmSchema,
  OPERATIONS_ALL,
  RESOURCES,
  VALID_OPERATIONS,
} from '../src/blocks/affirm/affirm-schema'
import { affirmToolMap } from '../src/blocks/affirm/affirm-tool-map'
import affirmExecute from '../src/blocks/affirm/affirm.server'
import { affirmToolsets } from '../src/tools/toolsets'

const PAIRS = RESOURCES.flatMap(({ value: resource }) =>
  (OPERATIONS_ALL[resource as keyof typeof OPERATIONS_ALL] ?? []).map((op) => ({
    resource,
    operation: op.value as string,
    key: `${resource}.${op.value}`,
  }))
)

const toolMap = affirmToolMap as Record<string, string>

/** Capture what the block dispatched, without calling Affirm. */
function runBlock(input: Record<string, any>, output: Record<string, any> = {}) {
  const calls: { toolId: string; input: Record<string, any> }[] = []
  const ctx = {
    runTool: async (toolId: string, toolInput: Record<string, any>) => {
      calls.push({ toolId, input: toolInput })
      return output
    },
  }
  return {
    calls,
    result: (affirmExecute as any)(input, ctx) as Promise<Record<string, any>>,
  }
}

describe('the operation surface', () => {
  it('advertises exactly the four reads, and no write', () => {
    expect(PAIRS.map((p) => p.key)).toEqual([
      'settlement.getMany',
      'settlement.getEvents',
      'charge.getMany',
      'charge.get',
    ])
    // Not a stylistic assertion. A capture, refund or void appearing here is a
    // write against a live lender's loan with no sandbox to rehearse in, and it
    // would be reachable by Kopilot without the panel ever rendering.
    for (const { operation } of PAIRS) {
      expect(operation).not.toMatch(/capture|refund|void|create|update|delete|cancel/i)
    }
  })

  it.each(PAIRS)('$key is listed in VALID_OPERATIONS', ({ resource, operation }) => {
    expect(VALID_OPERATIONS[resource]).toContain(operation)
  })

  it.each(PAIRS)('$key maps to a tool that exists on disk with that id', ({ key }) => {
    const toolId = toolMap[key]
    expect(toolId).toBeTruthy()

    // The block dispatches to the app's OWN read tools rather than block-private
    // copies, so the id must be a real `defineTool` id — `ctx.runTool` resolves
    // it off the bundle's tool registry and throws `Tool not found` otherwise.
    const tool = new URL(`../src/tools/${toolId}.tool.tsx`, import.meta.url)
    expect(existsSync(tool)).toBe(true)
    expect(readFileSync(tool, 'utf8')).toContain(`id: '${toolId}',`)
  })

  it.each(PAIRS)('$key dispatches to a granted READ tool, never a write one', ({ key }) => {
    // A tool absent from every toolset would still dispatch, but it would be a
    // surface nobody reviewed. And a tool in the WRITE toolset must never be
    // reachable from this block: build plan §7's capture, refund and void are a
    // different risk class, behind their own fence, and a block operation is
    // reachable by Kopilot without the panel ever rendering.
    const granted = affirmToolsets.flatMap((toolset) => toolset.tools)
    expect(granted).toContain(toolMap[key])

    const writeToolset = affirmToolsets.find((toolset) => /write/.test(toolset.id))
    if (writeToolset) expect(writeToolset.tools).not.toContain(toolMap[key])
  })

  it('maps no tool for an operation nothing advertises', () => {
    const advertised = new Set(PAIRS.map((p) => p.key))
    for (const key of Object.keys(toolMap)) {
      expect(advertised.has(key)).toBe(true)
    }
  })

  it('refuses a resource or an operation it does not advertise', async () => {
    await expect(runBlock({ resource: 'loan', operation: 'get' }).result).rejects.toThrow(
      'Unknown resource: loan'
    )
    await expect(
      runBlock({ resource: 'charge', operation: 'refund', chargeId: 'CPDZ-ANRU' }).result
    ).rejects.toThrow('Invalid operation "refund" for resource "charge"')
    // `getEvents` is real, but only on `settlement`.
    await expect(runBlock({ resource: 'charge', operation: 'getEvents' }).result).rejects.toThrow(
      'Invalid operation "getEvents" for resource "charge"'
    )
  })
})

describe('the schema', () => {
  it('namespaces every resource input, so one flat object holds all four ops', () => {
    const keys = Object.keys(affirmSchema.inputs)
    expect(keys.slice(0, 2)).toEqual(['resource', 'operation'])
    for (const key of keys.slice(2)) {
      // `chargeId` is the one deliberate exception: it is the block's only
      // required input, and the platform's block validation checks required TOOL
      // input names against the node config. Prefixing it would put a permanent
      // false "chargeId is required and is empty" warning on every charge.get
      // node. See the schema file header.
      if (key === 'chargeId') continue
      expect(key).toMatch(/^(settlementGetMany|settlementGetEvents|chargeGetMany)[A-Z]/)
    }
  })

  it('requires a charge id, and nothing else', () => {
    const required = Object.entries(affirmSchema.inputs)
      .filter(([, node]) => (node as any).toJSON?.()?._metadata?.required === true)
      .map(([name]) => name)
    expect(required).toEqual(['chargeId'])
  })

  it('caps page sizes at the dispatched tools’ own limits', () => {
    const max = (name: keyof typeof affirmSchema.inputs) =>
      (affirmSchema.inputs[name] as any).toJSON()._metadata.max
    // `list_affirm_settlements` / `list_affirm_settlement_events` cap at 250 —
    // which is itself the platform's persisted-membership page cap, not
    // Affirm's maximum of 1000.
    expect(max('settlementGetManyLimit')).toBe(250)
    expect(max('settlementGetEventsLimit')).toBe(250)
    // `list_affirm_charges` caps at 200.
    expect(max('chargeGetManyLimit')).toBe(200)
  })
})

describe('input projection', () => {
  it('maps the deposit window onto list_affirm_settlements', async () => {
    const run = runBlock({
      resource: 'settlement',
      operation: 'getMany',
      settlementGetManyAfter: '2026-09-15',
      settlementGetManyBefore: '2026-09-16',
      settlementGetManyLimit: 250,
      settlementGetManyCursor: 'from_cursor_uuid=abc',
    })
    await run.result
    expect(run.calls).toEqual([
      {
        toolId: 'list_affirm_settlements',
        input: {
          after: '2026-09-15',
          before: '2026-09-16',
          limit: 250,
          cursor: 'from_cursor_uuid=abc',
        },
      },
    ])
  })

  it('maps a deposit id onto list_affirm_settlement_events', async () => {
    const run = runBlock({
      resource: 'settlement',
      operation: 'getEvents',
      settlementGetEventsDepositId: 'I5Y8PHAWWSSS2WJ',
      settlementGetEventsAfter: '2026-09-15',
    })
    await run.result
    expect(run.calls[0]).toEqual({
      toolId: 'list_affirm_settlement_events',
      input: {
        after: '2026-09-15',
        before: undefined,
        depositId: 'I5Y8PHAWWSSS2WJ',
        limit: undefined,
        cursor: undefined,
      },
    })
  })

  it('maps a charge lookup onto get_affirm_charge', async () => {
    const run = runBlock({ resource: 'charge', operation: 'get', chargeId: ' CPDZ-ANRU ' })
    await run.result
    expect(run.calls[0]).toEqual({
      toolId: 'get_affirm_charge',
      input: { chargeId: 'CPDZ-ANRU' },
    })
  })

  it('maps an order id onto list_affirm_charges', async () => {
    const run = runBlock({
      resource: 'charge',
      operation: 'getMany',
      chargeGetManyAfter: '2026-09-01T00:00:00Z',
      chargeGetManyOrderId: 'rPhjzMna9vESRYlOF0hLADbBL',
    })
    await run.result
    expect(run.calls[0]!.input).toMatchObject({
      after: '2026-09-01T00:00:00Z',
      orderId: 'rPhjzMna9vESRYlOF0hLADbBL',
      limit: undefined,
    })
  })

  it('drops a blank or unusable page size instead of forwarding it', async () => {
    // 🛑 The reason this exists. A bindable input can arrive as `''`, which
    // survives the tool's `limit ?? 250` default, then falls out of the query
    // string in `affirmApi` — leaving Affirm's OWN page default of 5. The page
    // comes back short and nothing says so.
    for (const bad of ['', null, undefined, 'none', 0, -3]) {
      const run = runBlock({
        resource: 'settlement',
        operation: 'getMany',
        settlementGetManyLimit: bad,
      })
      await run.result
      expect(run.calls[0]!.input.limit).toBeUndefined()
    }
    // A number that arrived as text is still a usable count.
    const run = runBlock({
      resource: 'settlement',
      operation: 'getMany',
      settlementGetManyLimit: '250',
    })
    await run.result
    expect(run.calls[0]!.input.limit).toBe(250)
  })

  it('drops blank strings so an untouched optional field is not sent as a filter', async () => {
    const run = runBlock({
      resource: 'settlement',
      operation: 'getEvents',
      settlementGetEventsDepositId: '   ',
      settlementGetEventsAfter: '',
    })
    await run.result
    expect(run.calls[0]!.input.depositId).toBeUndefined()
    expect(run.calls[0]!.input.after).toBeUndefined()
  })
})

describe('output variables', () => {
  const names = (resource: string, operation: string) =>
    Object.keys(affirmComputeOutputs(resource, operation))

  it('publishes per operation, not a union of everything', () => {
    expect(names('settlement', 'getMany')).toEqual([
      'summary',
      'settlements',
      'settlementCount',
      'rejected',
      'nextCursor',
      'hasMore',
    ])
    expect(names('settlement', 'getEvents')).toEqual([
      'summary',
      'events',
      'eventCount',
      'complete',
      'rejected',
      'scannedAfter',
      'scannedBefore',
      'nextCursor',
      'hasMore',
    ])
    expect(names('charge', 'getMany')).toEqual([
      'summary',
      'charges',
      'chargeCount',
      'rejected',
      'hasMore',
    ])
    expect(names('charge', 'get')).toEqual([
      'shopifyPaymentSessionId',
      'orderId',
      'summary',
      'charge',
      'events',
    ])
    // A pair the block does not dispatch publishes nothing, rather than a
    // plausible-looking shape a node could be built against.
    expect(names('charge', 'refund')).toEqual([])
    expect(names('loan', 'getMany')).toEqual([])
  })

  it('leads charge.get with the Shopify payment session id', () => {
    // Position matters: the catalog keeps the base selection's field order, so
    // this is what an author sees first in the variable picker. It is the join
    // key back to the Shopify order, which is the point of the operation.
    expect(names('charge', 'get')[0]).toBe('shopifyPaymentSessionId')
  })

  it('reaches every advertised pair', () => {
    for (const { resource, operation } of PAIRS) {
      expect(names(resource, operation).length).toBeGreaterThan(0)
    }
    // The schema's own entry point agrees with the function.
    expect(
      Object.keys(affirmSchema.computeOutputs({ resource: 'charge', operation: 'get' }))
    ).toEqual(names('charge', 'get'))
  })

  it('never declares a settlement total the block would have to invent', () => {
    // A deposit is transcribed, never derived (build plan §3.4 rule 3). Summing
    // a page of deposits produces a figure Affirm never stated, and it balances,
    // so nothing downstream would catch it.
    expect(names('settlement', 'getMany')).not.toContain('totalSettled')
    expect(names('settlement', 'getMany')).not.toContain('total')
  })

  it('keeps every money value a string, so nothing binds a float to cash', () => {
    const settlement = (affirmComputeOutputs('settlement', 'getMany') as any).settlements.toJSON()
      .items.fields
    expect(settlement.totalSettled.type).toBe('string')
    expect(settlement.reportedFees.type).toBe('string')

    const event = (affirmComputeOutputs('settlement', 'getEvents') as any).events.toJSON().items
      .fields
    for (const key of ['gross', 'fee', 'net']) {
      expect(event[key].type).toBe('string')
    }
  })
})

describe('output shaping', () => {
  it('counts a page of deposits without touching the amounts', async () => {
    const run = runBlock(
      { resource: 'settlement', operation: 'getMany' },
      {
        summary: '1 Affirm deposit from 2026-09-15 to 2026-09-15 in USD. This is the last page.',
        settlements: [
          {
            depositId: 'I5Y8PHAWWSSS2WJ',
            date: '2026-09-15',
            status: 'paid',
            totalSettled: '3579.30',
            currency: 'USD',
            currencyExponent: 2,
            accountLastFour: '6670',
            reportedSales: '3740.05',
            reportedRefunds: '0.00',
            reportedFees: '-160.75',
          },
        ],
        rejected: 0,
        nextCursor: null,
        hasMore: false,
      }
    )
    const out = await run.result
    expect(out.settlementCount).toBe(1)
    expect((out.settlements as any[])[0].totalSettled).toBe('3579.30')
    // Affirm reports fees negative on the deposit header and the block quotes
    // the sign as given. The settlement EVENT's `fee` is the positive one.
    expect((out.settlements as any[])[0].reportedFees).toBe('-160.75')
    expect(out.hasMore).toBe(false)
  })

  it('carries the honesty flag through on a deposit’s membership', async () => {
    const run = runBlock(
      {
        resource: 'settlement',
        operation: 'getEvents',
        settlementGetEventsDepositId: 'I5Y8PHAWWSSS2WJ',
      },
      {
        summary: 'MORE PAGES REMAIN — this is not the complete set.',
        events: [
          {
            id: '53f9cad7-b293-4918-b7d4-6716c64e21de',
            depositId: 'I5Y8PHAWWSSS2WJ',
            date: '2026-09-14T19:28:14Z',
            type: 'charge',
            providerType: 'loan_capture',
            gross: '3740.05',
            fee: '160.75',
            net: '3579.30',
            currency: 'USD',
            orderId: 'rPhjzMna9vESRYlOF0hLADbBL',
            transactionId: 'oTzSBZG2TU5WGc28',
            sourceId: 'CPDZ-ANRU',
          },
        ],
        rejected: 0,
        scannedAfter: '2026-09-14',
        scannedBefore: '2026-09-16',
        complete: false,
        nextCursor: 'from_cursor_uuid=next',
        hasMore: true,
      }
    )
    const out = await run.result
    expect(out.eventCount).toBe(1)
    // The flag a downstream node must branch on. Treating a partial membership
    // as a deposit total is how a deposit posts short.
    expect(out.complete).toBe(false)
    expect(out.hasMore).toBe(true)
    expect(out.scannedAfter).toBe('2026-09-14')
    expect((out.events as any[])[0].fee).toBe('160.75')
  })

  it('lifts the Shopify payment session id to a top-level variable', async () => {
    const run = runBlock(
      { resource: 'charge', operation: 'get', chargeId: 'CPDZ-ANRU' },
      {
        summary: 'Affirm charge CPDZ-ANRU for 3740.05 USD, status captured.',
        id: 'CPDZ-ANRU',
        orderId: 'rPhjzMna9vESRYlOF0hLADbBL',
        status: 'captured',
        amount: '3740.05',
        amountRefunded: null,
        currency: 'USD',
        created: '2026-09-14T19:28:12Z',
        authorizationExpiration: null,
        checkoutId: 'HZN3BCP2ZTFZK6T7',
        eventCount: 1,
        events: [
          {
            id: '243EYFJGASKXX8BN',
            type: 'auth',
            amount: '3740.05',
            created: '2026-09-14T19:28:12Z',
          },
        ],
        shopifyPaymentSessionId: 'gid://shopify/PaymentSession/rPhjzMna9vESRYlOF0hLADbBL',
        platformType: 'Shopify',
        checkoutOrderId: 'rPhjzMna9vESRYlOF0hLADbBL',
      }
    )
    const out = await run.result

    // Verbatim, gid prefix and all — this is the value the Shopify connector
    // already writes as `customer_transaction_payment_id`, which is what makes
    // the join possible without any Shopify-side work.
    expect(out.shopifyPaymentSessionId).toBe(
      'gid://shopify/PaymentSession/rPhjzMna9vESRYlOF0hLADbBL'
    )
    // Affirm's own order_id: the same id WITHOUT the gid prefix.
    expect(out.orderId).toBe('rPhjzMna9vESRYlOF0hLADbBL')
    expect((out.charge as any).id).toBe('CPDZ-ANRU')
    expect((out.charge as any).amount).toBe('3740.05')
    expect((out.charge as any).checkoutOrderId).toBe('rPhjzMna9vESRYlOF0hLADbBL')
    expect((out.events as any[])[0].type).toBe('auth')
  })

  it('does not widen what get_affirm_charge withholds', () => {
    // The allowlist, stated once. `get_affirm_charge` projects only
    // `checkout.metadata` off an expanded Affirm checkout — never `billing`,
    // `shipping` or the customer — and `affirm-tools.test.ts` asserts that at
    // the tool. This asserts the block cannot undo it: the projection is an
    // allowlist, so a field the tool grows later is NOT surfaced until someone
    // adds it deliberately.
    const allowed = new Set([
      'id',
      'orderId',
      'status',
      'amount',
      'amountRefunded',
      'currency',
      'created',
      'authorizationExpiration',
      'checkoutId',
      'eventCount',
      'platformType',
      'checkoutOrderId',
    ])
    const declared = Object.keys(
      (affirmComputeOutputs('charge', 'get') as any).charge.toJSON().fields
    )
    expect(new Set(declared)).toEqual(allowed)
  })

  it('drops a leaked customer field even if the tool hands one over', async () => {
    const run = runBlock(
      { resource: 'charge', operation: 'get', chargeId: 'CPDZ-ANRU' },
      {
        summary: 'Affirm charge CPDZ-ANRU.',
        id: 'CPDZ-ANRU',
        orderId: 'rPhjzMna9vESRYlOF0hLADbBL',
        shopifyPaymentSessionId: 'gid://shopify/PaymentSession/rPhjzMna9vESRYlOF0hLADbBL',
        events: [],
        // None of these can reach a tool today. They are here because the block
        // is what a workflow node renders into an email, and an allowlist that
        // is never tested is an allowlist nobody notices turning into a spread.
        billing: { name: 'A Real Person', email: 'person@example.com' },
        shipping: { address: '1 Somewhere St' },
        customer: { email: 'person@example.com' },
      }
    )
    const out = await run.result
    const serialized = JSON.stringify(out)
    expect(out).not.toHaveProperty('billing')
    expect(out).not.toHaveProperty('shipping')
    expect(out).not.toHaveProperty('customer')
    expect(serialized).not.toContain('A Real Person')
    expect(serialized).not.toContain('person@example.com')
    expect(serialized).not.toContain('1 Somewhere St')
    // ...and the join key still came through.
    expect(out.shopifyPaymentSessionId).toBe(
      'gid://shopify/PaymentSession/rPhjzMna9vESRYlOF0hLADbBL'
    )
  })
})

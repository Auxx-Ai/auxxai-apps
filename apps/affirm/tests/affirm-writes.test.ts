// tests/affirm-writes.test.ts
//
// Capture, refund and void — build plan §7.
//
// ⚠️ NOTHING HERE TOUCHES AFFIRM. This account has production keys and no
// sandbox, so every one of these calls would land on a real customer's consumer
// loan. `fetch` is stubbed in `beforeEach` and every request is asserted rather
// than issued. If a test in this file ever makes a real request, that is the
// bug, not the assertion that caught it.
//
// What is actually being protected:
//
//   1. The REQUEST SHAPE — method, path, JSON body keys, and integer minor
//      units. Affirm's three write bodies disagree with each other (capture
//      takes shipping fields, void takes almost nothing), and none of them was
//      inferred from another.
//   2. The IDEMPOTENCY KEY is deterministic, sent on every write, differs per
//      operation / amount / referenceId, and is header-safe.
//   3. 409 is surfaced as a CONFLICT that names the OTHER operation, because
//      the void/refund boundary is Affirm's to decide, not ours.
//   4. A refund's `amount` and `fee` are reported separately, never netted.
//   5. Shopify is not called, and every result says Shopify was not told.

import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { captureAffirmChargeTool } from '../src/tools/capture_affirm_charge.tool'
import captureAffirmCharge from '../src/tools/capture_affirm_charge.tool.server'
import { refundAffirmChargeTool } from '../src/tools/refund_affirm_charge.tool'
import refundAffirmCharge from '../src/tools/refund_affirm_charge.tool.server'
import {
  exampleCaptureResult,
  exampleRefundResult,
  exampleVoidResult,
} from '../src/tools/shared/schemas'
import { affirmToolsets } from '../src/tools/toolsets'
import { affirmIdempotencyKey, projectWriteEvent } from '../src/tools/shared/writes'
import { voidAffirmChargeTool } from '../src/tools/void_affirm_charge.tool'
import voidAffirmCharge from '../src/tools/void_affirm_charge.tool.server'

interface Captured {
  url: URL
  method: string
  headers: Record<string, string>
  body: unknown
}

let requests: Captured[] = []
let responses: Response[] = []

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  requests = []
  responses = []
  ;(globalThis as any).AUXX_SERVER_SDK = {
    getConnection: () => ({
      type: 'secret',
      value: '',
      fields: { merchant_id: '07JVNWWI5PZM8L7Y', public_key: 'pub', private_key: 'priv' },
    }),
  }
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries((init?.headers ?? {}) as Record<string, string>)) {
      headers[key.toLowerCase()] = value
    }
    requests.push({
      url: new URL(String(input)),
      method: init?.method ?? 'GET',
      headers,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body,
    })
    const next = responses.shift()
    if (!next) throw new Error(`Unexpected Affirm request: ${String(input)}`)
    return next
  }) as typeof fetch
})

/**
 * ⚠️ SYNTHETIC. The documented capture/refund response shape from
 * docs.affirm.com — there is no observed one, because there is no sandbox.
 */
const CAPTURE_RESPONSE = {
  type: 'capture',
  currency: 'USD',
  created: '2026-09-15T16:04:11Z',
  amount: 374005,
  fee: 16045,
  id: 'NNRQ-3QBV',
}

/** ⚠️ SYNTHETIC. A 25.00 request answered with a refunded fee folded into `amount`. */
const REFUND_RESPONSE = {
  type: 'refund',
  currency: 'USD',
  created: '2026-09-15T17:22:05Z',
  amount: 2607,
  fee: 107,
  id: 'RFND-7K2Q',
}

/** ⚠️ SYNTHETIC. Void documents NO currency, amount or fee. */
const VOID_RESPONSE = {
  type: 'void',
  created: '2026-09-15T15:10:44Z',
  id: 'VOID-2M8T',
}

describe('capture_affirm_charge', () => {
  it('POSTs to /capture with only the fields the caller set', async () => {
    responses.push(jsonResponse(CAPTURE_RESPONSE))

    const result = await captureAffirmCharge({
      chargeId: 'CPDZ-ANRU',
      orderId: '1041',
      shippingCarrier: 'fedex',
      shippingConfirmation: '770000000099',
    })

    const request = requests[0]!
    expect(request.method).toBe('POST')
    expect(request.url.pathname).toBe('/api/v1/transactions/CPDZ-ANRU/capture')
    expect(request.headers['content-type']).toBe('application/json')
    // Documented capture body keys, snake_case. `amount` and `reference_id`
    // were not set, so they are absent — not sent as null.
    expect(request.body).toEqual({
      order_id: '1041',
      shipping_carrier: 'fedex',
      shipping_confirmation: '770000000099',
    })

    expect(result.event.amountMinor).toBe(374005)
    expect(result.event.amount).toBe('3740.05')
    expect(result.event.fee).toBe('160.45')
    // No amount was sent: this was a full capture, and the summary says so.
    expect(result.requestedAmountMinor).toBeNull()
    expect(result.summary).toMatch(/FULL capture/)
  })

  it('sends an integer minor-unit amount verbatim for a split capture', async () => {
    responses.push(jsonResponse({ ...CAPTURE_RESPONSE, amount: 2500, fee: 107 }))

    const result = await captureAffirmCharge({ chargeId: 'CPDZ-ANRU', amountMinor: 2500 })

    // 2500 cents in, 2500 out. Never 25, never 2500.0.
    expect((requests[0]!.body as Record<string, unknown>).amount).toBe(2500)
    expect(result.event.amount).toBe('25.00')
    expect(result.requestedAmountMinor).toBe(2500)
  })
})

describe('refund_affirm_charge', () => {
  it('omits amount entirely for a full refund', async () => {
    responses.push(jsonResponse({ ...REFUND_RESPONSE, amount: 374005, fee: 16045 }))

    const result = await refundAffirmCharge({ chargeId: 'CPDZ-ANRU' })

    expect(requests[0]!.url.pathname).toBe('/api/v1/transactions/CPDZ-ANRU/refund')
    // Affirm reads an ABSENT amount as "the whole remaining balance". Sending
    // `null` or `0` would be a different, and rejected, request.
    expect(requests[0]!.body).toEqual({})
    expect(result.requestedAmountMinor).toBeNull()
    expect(result.summary).toMatch(/FULL refund of the remaining balance/)
  })

  it('reports amount and fee separately when the refund carries a refunded fee', async () => {
    responses.push(jsonResponse(REFUND_RESPONSE))

    const result = await refundAffirmCharge({
      chargeId: 'CPDZ-ANRU',
      amountMinor: 2500,
      referenceId: 'rma-4182',
    })

    expect(requests[0]!.body).toEqual({ amount: 2500, reference_id: 'rma-4182' })
    // Affirm's returned amount INCLUDES the refunded fee and is therefore
    // larger than what was asked for. Both numbers survive; neither is netted
    // into the other, and nothing "corrects" 2607 back down to 2500.
    expect(result.event.amountMinor).toBe(2607)
    expect(result.event.amount).toBe('26.07')
    expect(result.event.feeMinor).toBe(107)
    expect(result.event.fee).toBe('1.07')
    expect(result.requestedAmountMinor).toBe(2500)
    expect(result.summary).toMatch(/ALREADY INCLUDES it/)
    expect(result.summary).toMatch(/differs from the requested amount/)
  })

  it('tells the operator Shopify was not told, on the result and not only in the docs', async () => {
    responses.push(jsonResponse(REFUND_RESPONSE))

    const result = await refundAffirmCharge({ chargeId: 'CPDZ-ANRU', amountMinor: 2500 })

    expect(result.shopifyNotice).toMatch(/Shopify was not told/)
    expect(result.summary).toContain(result.shopifyNotice)
    // And nothing in this app ever calls Shopify. One request, to Affirm.
    expect(requests).toHaveLength(1)
    expect(requests[0]!.url.origin).toBe('https://api.affirm.com')
  })

  it('surfaces a 409 as a conflict naming VOID as the other operation', async () => {
    responses.push(
      jsonResponse({ message: 'Transaction has not been captured.', code: 'invalid-request' }, 409)
    )

    const error = await refundAffirmCharge({ chargeId: 'CPDZ-ANRU' }).catch((e: Error) => e)

    expect((error as Error & { code?: string }).code).toBe('CONFLICT')
    // Affirm's own message survives; ours is APPENDED, not substituted — a
    // refusal we did not anticipate still arrives intact.
    expect(error.message).toContain('Transaction has not been captured.')
    // And the boundary question is answered by naming the other operation,
    // rather than by this app guessing at it in code.
    expect(error.message).toMatch(/void_affirm_charge/)
  })
})

describe('void_affirm_charge', () => {
  it('POSTs to /void and reports the absent amount as absent, not as zero', async () => {
    responses.push(jsonResponse(VOID_RESPONSE))

    const result = await voidAffirmCharge({ chargeId: 'CPDZ-ANRU' })

    expect(requests[0]!.method).toBe('POST')
    expect(requests[0]!.url.pathname).toBe('/api/v1/transactions/CPDZ-ANRU/void')
    expect(requests[0]!.body).toEqual({})
    expect(result.event.id).toBe('VOID-2M8T')
    expect(result.event.type).toBe('void')
    // Null, never '0.00'. Affirm reports no money on a void and saying zero
    // would be inventing a fact about a cancelled loan.
    expect(result.event.amount).toBeNull()
    expect(result.event.amountMinor).toBeNull()
    expect(result.event.currency).toBeNull()
    expect(result.summary).toMatch(/reports no amount on a void/)
  })

  it('surfaces a 409 as a conflict naming REFUND as the other operation', async () => {
    responses.push(jsonResponse({ message: 'Transaction is already captured.' }, 409))

    await expect(
      voidAffirmCharge({ chargeId: 'CPDZ-ANRU' }).catch((e: Error) => e.message)
    ).resolves.toMatch(/refund_affirm_charge/)
  })
})

describe('the idempotency key', () => {
  it('rides on every write', async () => {
    for (const [tool, response] of [
      [() => captureAffirmCharge({ chargeId: 'CPDZ-ANRU' }), CAPTURE_RESPONSE],
      [() => refundAffirmCharge({ chargeId: 'CPDZ-ANRU' }), REFUND_RESPONSE],
      [() => voidAffirmCharge({ chargeId: 'CPDZ-ANRU' }), VOID_RESPONSE],
    ] as [() => Promise<{ idempotencyKey: string }>, unknown][]) {
      requests = []
      responses = [jsonResponse(response)]
      const result = await tool()
      const sent = requests[0]!.headers['idempotency-key']
      expect(sent).toBe(result.idempotencyKey)
      // Header-safe by construction: hex, so a caller's free-form reference_id
      // can never reach a request header.
      expect(sent).toMatch(/^auxx-(capture|refund|void)-[0-9a-f]{64}$/)
    }
  })

  it('is the SAME for a retry of the same logical request', async () => {
    responses.push(jsonResponse(REFUND_RESPONSE), jsonResponse(REFUND_RESPONSE))

    const first = await refundAffirmCharge({ chargeId: 'CPDZ-ANRU', amountMinor: 2500 })
    const second = await refundAffirmCharge({ chargeId: 'CPDZ-ANRU', amountMinor: 2500 })

    // This is the whole point: an agent that retries its own tool call, or an
    // operator re-running after a timeout, does NOT refund twice.
    expect(second.idempotencyKey).toBe(first.idempotencyKey)
  })

  it('differs on operation, amount and referenceId', async () => {
    const base = { merchantId: 'M', chargeId: 'CPDZ-ANRU' } as const
    const keys = await Promise.all([
      affirmIdempotencyKey({ ...base, operation: 'refund' }),
      affirmIdempotencyKey({ ...base, operation: 'void' }),
      affirmIdempotencyKey({ ...base, operation: 'capture' }),
      affirmIdempotencyKey({ ...base, operation: 'refund', amountMinor: 2500 }),
      affirmIdempotencyKey({ ...base, operation: 'refund', amountMinor: 1000 }),
      affirmIdempotencyKey({ ...base, operation: 'refund', referenceId: 'rma-1' }),
      affirmIdempotencyKey({ ...base, operation: 'refund', referenceId: 'rma-2' }),
      affirmIdempotencyKey({ ...base, operation: 'refund', chargeId: 'OTHER-1234' }),
      affirmIdempotencyKey({ ...base, operation: 'refund', merchantId: 'N' }),
    ])
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('cannot be forged by a referenceId that looks like a field separator', async () => {
    // The material is JSON-encoded, so no caller string can shift a field
    // boundary and collide two different requests onto one key.
    const a = await affirmIdempotencyKey({
      operation: 'refund',
      merchantId: 'M',
      chargeId: 'A',
      referenceId: '","B","',
    })
    const b = await affirmIdempotencyKey({
      operation: 'refund',
      merchantId: 'M',
      chargeId: 'A","B',
      referenceId: '"',
    })
    expect(a).not.toBe(b)
  })

  it('treats a full refund as a distinct key from any partial one', async () => {
    const base = { operation: 'refund', merchantId: 'M', chargeId: 'A' } as const
    expect(await affirmIdempotencyKey(base)).not.toBe(
      await affirmIdempotencyKey({ ...base, amountMinor: 0 })
    )
  })
})

describe('projectWriteEvent never throws', () => {
  // By the time this runs the money HAS MOVED. A projection that threw would
  // report a completed refund as a failure and invite a second one.
  it('survives an empty body, a garbage body, and an unknown currency', () => {
    expect(projectWriteEvent({})).toEqual({
      id: null,
      type: null,
      created: null,
      currency: null,
      amount: null,
      amountMinor: null,
      fee: null,
      feeMinor: null,
    })
    expect(projectWriteEvent({ amount: 'not a number', fee: {}, id: 42 }).amount).toBeNull()
    expect(projectWriteEvent({ currency: 'ZZZ', amount: 2500 }).amount).toBe('25.00')
  })

  it('reads a minor-unit amount Affirm sent as a numeric string', () => {
    expect(projectWriteEvent({ amount: '2500', currency: 'USD' }).amountMinor).toBe(2500)
  })
})

describe('the fence — toolset separation and surfaces', () => {
  const writeTools = [captureAffirmChargeTool, refundAffirmChargeTool, voidAffirmChargeTool]
  const readToolset = affirmToolsets.find((set) => set.id === 'affirm.settlements')!
  const writeToolset = affirmToolsets.find((set) => set.id === 'affirm.write')!

  it('keeps the writes out of the read toolset entirely', () => {
    // Granting an agent the ability to LOOK UP what a customer financed must
    // never be the same admin decision as granting it the ability to move
    // money on that loan.
    expect(writeToolset.tools).toEqual([
      'capture_affirm_charge',
      'refund_affirm_charge',
      'void_affirm_charge',
    ])
    for (const id of writeToolset.tools) expect(readToolset.tools).not.toContain(id)
    for (const tool of writeTools) expect(tool.agent?.toolsetSlug).toBe('affirm.write')
  })

  it('narrows the writes to `internal` alone — off chat, email AND builder', () => {
    // The reads already exclude chat and email. The writes go one further and
    // drop `builder` too: with production keys and no sandbox there is no such
    // thing as trying a refund out to see what it does.
    expect(readToolset.tools.length).toBeGreaterThan(0)
    for (const tool of writeTools) {
      expect(tool.agent?.surfaces).toEqual(['internal'])
      expect(tool.agent?.surfaces).not.toContain('chat')
      expect(tool.agent?.surfaces).not.toContain('email')
      expect(tool.agent?.externalSafe).toBeUndefined()
    }
  })

  it('never marks a write idempotent to the model', () => {
    // `idempotent` is an LLM hint that a call is free to repeat. On a refund it
    // is the opposite of true, whatever the Idempotency-Key does for a retry of
    // the SAME request.
    for (const tool of writeTools) {
      expect(tool.agent?.idempotent).toBeUndefined()
      expect(tool.config?.idempotent).toBeUndefined()
    }
  })

  it('tells the admin, in the toolset they are granting, what it does', () => {
    expect(writeToolset.description).toMatch(/MOVE REAL MONEY/)
    expect(writeToolset.description).toMatch(/DO NOT GIVE THIS TOOLSET TO A CUSTOMER-FACING AGENT/)
    expect(writeToolset.description).toMatch(/do NOT tell Shopify/)
  })

  it('warns the model, in every write description, about all four hazards', () => {
    for (const tool of writeTools) {
      // 1. Real money on a real loan.
      expect(tool.description).toMatch(/REAL (MONEY|CUSTOMER)/)
      // 2. Shopify is not told, so the order reads as unreconciled there.
      expect(tool.description).toMatch(/DOES NOT TELL SHOPIFY/)
      // 3. Amounts are integer minor units, not dollars.
      expect(tool.description).toMatch(/INTEGER MINOR UNITS/)
      // 4. A different key is a second, real operation.
      expect(tool.description).toMatch(/Idempotency-Key/)
    }
    // And each names the OTHER operation, because the boundary is Affirm's.
    expect(refundAffirmChargeTool.description).toMatch(/VOID \(void_affirm_charge\)/)
    expect(voidAffirmChargeTool.description).toMatch(/REFUND \(refund_affirm_charge\)/)
    expect(captureAffirmChargeTool.description).toMatch(/refund_affirm_charge/)
    // The refund is the one that must say, in as many words, that a second
    // call with a different key refunds twice.
    expect(refundAffirmChargeTool.description).toMatch(/DIFFERENT KEY AND REFUNDS TWICE/)
  })

  it('ships an example output that satisfies its own schema', () => {
    // The catalog extractor validates `exampleOutput` against `outputs` at
    // publish time. ⚠️ These three examples are SYNTHETIC — there is no sandbox
    // and no observed write response — so this is the only thing standing
    // between an invented example and a broken eval autofill.
    for (const tool of writeTools) {
      expect(() => tool.outputs.parse(tool.exampleOutput)).not.toThrow()
      // And the invented key is shaped like a real derived one.
      expect((tool.exampleOutput as { idempotencyKey: string }).idempotencyKey).toMatch(
        /^auxx-(capture|refund|void)-[0-9a-f]{64}$/
      )
    }
  })

  it('ships an example summary the tool would actually produce', async () => {
    // The VALUES in the three write examples are invented — there is no
    // sandbox. The PROSE does not have to be: each example is replayed through
    // its own server against the response it claims to describe, so an example
    // cannot drift into describing behaviour the tool does not have.
    const cases: [() => Promise<{ summary: string }>, unknown, { summary: string }][] = [
      [
        () => captureAffirmCharge({ chargeId: 'CPDZ-ANRU' }),
        CAPTURE_RESPONSE,
        exampleCaptureResult,
      ],
      [
        () =>
          refundAffirmCharge({ chargeId: 'CPDZ-ANRU', amountMinor: 2500, referenceId: 'rma-4182' }),
        REFUND_RESPONSE,
        exampleRefundResult,
      ],
      [() => voidAffirmCharge({ chargeId: 'CPDZ-ANRU' }), VOID_RESPONSE, exampleVoidResult],
    ]
    for (const [run, response, example] of cases) {
      requests = []
      responses = [jsonResponse(response)]
      expect((await run()).summary).toBe(example.summary)
    }
  })

  it('registers all three on the app, alongside the four reads', () => {
    // `src/app.tsx` is read as SOURCE rather than imported: it pulls `TextBlock`
    // from `@auxx/sdk/client`, a types-only export whose only runtime entry
    // boots the browser host runtime. A tool that is defined but never reaches
    // `app.tools` is registered nowhere, so the `tools: [...]` array literal is
    // extracted and asserted directly.
    const source = readFileSync(new URL('../src/app.tsx', import.meta.url), 'utf8')
    const toolsArray = /tools:\s*\[([\s\S]*?)\]/.exec(source)?.[1] ?? ''
    expect(toolsArray).not.toBe('')
    for (const tool of writeTools) {
      const symbol = `${tool.id.replace(/_(.)/g, (_, c: string) => c.toUpperCase())}Tool`
      expect(toolsArray).toContain(symbol)
      expect(source).toContain(`from './tools/${tool.id}.tool'`)
    }
    // The reads are still there — the writes were added, not swapped in.
    expect(toolsArray).toContain('listAffirmSettlementsTool')
    expect(toolsArray).toContain('getAffirmChargeTool')
  })
})

describe('the write path never retries', () => {
  it('lets a 429 out as a rate limit rather than re-sending the refund', async () => {
    responses.push(jsonResponse({ message: 'Too many requests' }, 429))

    await expect(refundAffirmCharge({ chargeId: 'CPDZ-ANRU' })).rejects.toMatchObject({
      code: 'RATE_LIMIT',
    })
    // One request. A client that retried a refund on its own behalf would be
    // deciding, for the caller, that the refund is replayable.
    expect(requests).toHaveLength(1)
  })

  it('redacts the private key out of a provider message', async () => {
    responses.push(jsonResponse({ message: 'bad key priv in request' }, 400))

    const message = await refundAffirmCharge({ chargeId: 'CPDZ-ANRU' }).catch(
      (e: Error) => e.message
    )
    expect(message).not.toContain('priv')
    expect(message).toContain('[redacted]')
  })
})

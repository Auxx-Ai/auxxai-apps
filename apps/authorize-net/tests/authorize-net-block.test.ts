// tests/authorize-net-block.test.ts

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  authorizeNetComputeOutputs,
  authorizeNetSchema,
  OPERATIONS_ALL,
  RESOURCES,
  VALID_OPERATIONS,
} from '../src/blocks/authorize-net/authorize-net-schema'
import { authorizeNetToolMap } from '../src/blocks/authorize-net/authorize-net-tool-map'
import authorizeNetExecute from '../src/blocks/authorize-net/authorize-net.server'
import { authorizeNetToolsets } from '../src/tools/toolsets'

const PAIRS = RESOURCES.flatMap(({ value: resource }) =>
  (OPERATIONS_ALL[resource as keyof typeof OPERATIONS_ALL] ?? []).map((op) => ({
    resource,
    operation: op.value as string,
    key: `${resource}.${op.value}`,
  }))
)

const toolMap = authorizeNetToolMap as Record<string, string>

/** Capture what the block dispatched, without calling Authorize.net. */
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
    result: (authorizeNetExecute as any)(input, ctx) as Promise<Record<string, any>>,
  }
}

describe('the operation surface', () => {
  it('advertises exactly the four reads, and no write', () => {
    expect(PAIRS.map((p) => p.key)).toEqual([
      'batch.getMany',
      'batch.getTransactions',
      'transaction.get',
      'transaction.getUnsettled',
    ])
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

    const tool = new URL(`../src/tools/${toolId}.tool.tsx`, import.meta.url)
    expect(existsSync(tool)).toBe(true)
    expect(readFileSync(tool, 'utf8')).toContain(`id: '${toolId}',`)
  })

  it.each(PAIRS)('$key dispatches to a granted tool', ({ key }) => {
    const granted = authorizeNetToolsets.flatMap((toolset) => toolset.tools)
    expect(granted).toContain(toolMap[key])
  })

  it('maps no tool for an operation nothing advertises', () => {
    const advertised = new Set(PAIRS.map((p) => p.key))
    for (const key of Object.keys(toolMap)) {
      expect(advertised.has(key)).toBe(true)
    }
  })

  it('refuses a resource or an operation it does not advertise', async () => {
    await expect(runBlock({ resource: 'payout', operation: 'get' }).result).rejects.toThrow(
      'Unknown resource: payout'
    )
    await expect(
      runBlock({ resource: 'transaction', operation: 'refund', transId: '12345' }).result
    ).rejects.toThrow('Invalid operation "refund" for resource "transaction"')
    await expect(runBlock({ resource: 'batch', operation: 'get' }).result).rejects.toThrow(
      'Invalid operation "get" for resource "batch"'
    )
  })
})

describe('the schema', () => {
  it('namespaces every resource input, bar the two tool-named ids', () => {
    const keys = Object.keys(authorizeNetSchema.inputs)
    expect(keys.slice(0, 2)).toEqual(['resource', 'operation'])
    for (const key of keys.slice(2)) {
      // Block validation matches the dispatched tool's required input names.
      if (key === 'batchId' || key === 'transId') continue
      expect(key).toMatch(/^(batchGetMany|batchGetTransactions|transactionGetUnsettled)[A-Z]/)
    }
  })

  it('caps page sizes at Authorize.net’s own paging limit', () => {
    const max = (name: keyof typeof authorizeNetSchema.inputs) =>
      (authorizeNetSchema.inputs[name] as any).toJSON()._metadata.max
    expect(max('batchGetTransactionsLimit')).toBe(1000)
    expect(max('transactionGetUnsettledLimit')).toBe(1000)
  })
})

describe('input projection', () => {
  it('maps the settlement window onto list_authorize_net_batches', async () => {
    const run = runBlock({
      resource: 'batch',
      operation: 'getMany',
      batchGetManyAfter: '2026-01-01',
      batchGetManyBefore: '2026-03-15',
    })
    await run.result
    expect(run.calls).toEqual([
      {
        toolId: 'list_authorize_net_batches',
        input: { after: '2026-01-01', before: '2026-03-15' },
      },
    ])
  })

  it('maps a batch id and cursor onto list_authorize_net_batch_transactions', async () => {
    const run = runBlock({
      resource: 'batch',
      operation: 'getTransactions',
      batchId: ' 10198080 ',
      batchGetTransactionsCursor: 'p2',
    })
    await run.result
    expect(run.calls[0]).toEqual({
      toolId: 'list_authorize_net_batch_transactions',
      input: { batchId: '10198080', limit: undefined, cursor: 'p2' },
    })
  })

  it('maps a transaction lookup onto get_authorize_net_transaction', async () => {
    const run = runBlock({ resource: 'transaction', operation: 'get', transId: ' 12345 ' })
    await run.result
    expect(run.calls[0]).toEqual({
      toolId: 'get_authorize_net_transaction',
      input: { transId: '12345' },
    })
  })

  it('drops a blank or unusable page size instead of forwarding it', async () => {
    // A bound input can arrive as `''`, which survives the tool's own default.
    for (const bad of ['', null, undefined, 'none', 0, -3]) {
      const run = runBlock({
        resource: 'transaction',
        operation: 'getUnsettled',
        transactionGetUnsettledLimit: bad,
      })
      await run.result
      expect(run.calls[0]!.input.limit).toBeUndefined()
    }
    const run = runBlock({
      resource: 'transaction',
      operation: 'getUnsettled',
      transactionGetUnsettledLimit: '1000',
    })
    await run.result
    expect(run.calls[0]!.input.limit).toBe(1000)
  })

  it('drops blank strings so an untouched optional field is not sent as a filter', async () => {
    const run = runBlock({
      resource: 'batch',
      operation: 'getMany',
      batchGetManyAfter: '   ',
      batchGetManyBefore: '',
    })
    await run.result
    expect(run.calls[0]!.input.after).toBeUndefined()
    expect(run.calls[0]!.input.before).toBeUndefined()
  })
})

describe('output variables', () => {
  const names = (resource: string, operation: string) =>
    Object.keys(authorizeNetComputeOutputs(resource, operation))

  it('publishes per operation, not a union of everything', () => {
    expect(names('batch', 'getMany')).toEqual([
      'summary',
      'batches',
      'batchCount',
      'rejected',
      'hasMore',
    ])
    expect(names('batch', 'getTransactions')).toEqual([
      'summary',
      'transactions',
      'transactionCount',
      'total',
      'rejected',
      'nextCursor',
      'hasMore',
    ])
    expect(names('transaction', 'get')).toEqual(['invoiceNumber', 'summary', 'transaction'])
    expect(names('transaction', 'getUnsettled')).toEqual([
      'summary',
      'transactions',
      'transactionCount',
      'total',
      'rejected',
      'nextCursor',
      'hasMore',
    ])
    expect(names('transaction', 'refund')).toEqual([])
    expect(names('payout', 'getMany')).toEqual([])
  })

  it('leads transaction.get with the invoice number', () => {
    expect(names('transaction', 'get')[0]).toBe('invoiceNumber')
  })

  it('reaches every advertised pair', () => {
    for (const { resource, operation } of PAIRS) {
      expect(names(resource, operation).length).toBeGreaterThan(0)
    }
    expect(
      Object.keys(authorizeNetSchema.computeOutputs({ resource: 'transaction', operation: 'get' }))
    ).toEqual(names('transaction', 'get'))
  })

  it('declares no fee anywhere, because none is on the wire', () => {
    const batch = (authorizeNetComputeOutputs('batch', 'getMany') as any).batches.toJSON().items
      .fields
    expect(Object.keys(batch)).not.toContain('fee')
    expect(Object.keys(batch)).not.toContain('feeAmount')
    const detail = (authorizeNetComputeOutputs('transaction', 'get') as any).transaction.toJSON()
      .fields
    expect(Object.keys(detail)).not.toContain('fee')
  })

  it('keeps every money value a string, so nothing binds a float to cash', () => {
    const batch = (authorizeNetComputeOutputs('batch', 'getMany') as any).batches.toJSON().items
      .fields
    expect(batch.netAmount.type).toBe('string')
    const transaction = (
      authorizeNetComputeOutputs('batch', 'getTransactions') as any
    ).transactions.toJSON().items.fields
    expect(transaction.amount.type).toBe('string')
  })
})

describe('output shaping', () => {
  it('counts a page of batches without touching the amounts', async () => {
    const run = runBlock(
      { resource: 'batch', operation: 'getMany' },
      {
        summary: '1 Authorize.net batch.',
        batches: [
          {
            batchId: '10198080',
            settledAt: '2014-10-24T18:48:19Z',
            settledOn: '2014-10-24',
            state: 'settledSuccessfully',
            paymentMethod: 'eCheck',
            netAmount: '12.22',
            currency: 'USD',
            perBrand: [],
          },
        ],
        rejected: 0,
        hasMore: false,
      }
    )
    const out = await run.result
    expect(out.batchCount).toBe(1)
    expect((out.batches as any[])[0].netAmount).toBe('12.22')
    expect(out.hasMore).toBe(false)
  })

  it('carries the cursor and the batch total through', async () => {
    const run = runBlock(
      { resource: 'batch', operation: 'getTransactions', batchId: '10198080' },
      {
        summary: 'MORE PAGES REMAIN — this is not the whole batch.',
        transactions: [{ transId: '12345', amount: '2.00' }],
        rejected: 0,
        nextCursor: 'p2',
        hasMore: true,
        total: 3,
      }
    )
    const out = await run.result
    expect(out.transactionCount).toBe(1)
    expect(out.total).toBe(3)
    expect(out.nextCursor).toBe('p2')
    expect(out.hasMore).toBe(true)
  })

  it('lifts the invoice number to a top-level variable', async () => {
    const run = runBlock(
      { resource: 'transaction', operation: 'get', transId: '12345' },
      {
        summary: 'Authorize.net transaction 12345.',
        transId: '12345',
        type: 'authCaptureTransaction',
        status: 'settledSuccessfully',
        submittedAt: '2010-08-30T17:49:20.757Z',
        settleAmount: '2.00',
        currency: 'USD',
        batchId: '10198080',
        invoiceNumber: 'INV00001',
        cardType: 'Visa',
        cardNumber: 'XXXX1111',
      }
    )
    const out = await run.result

    expect(out.invoiceNumber).toBe('INV00001')
    expect((out.transaction as any).transId).toBe('12345')
    expect((out.transaction as any).settleAmount).toBe('2.00')
    expect((out.transaction as any).cardNumber).toBe('XXXX1111')
  })

  it('drops a leaked customer field even if the tool hands one over', async () => {
    const run = runBlock(
      { resource: 'transaction', operation: 'get', transId: '12345' },
      {
        summary: 'Authorize.net transaction 12345.',
        transId: '12345',
        invoiceNumber: 'INV00001',
        // Unreachable today; the allowlist is what keeps them out of a rendered email.
        billTo: { firstName: 'A Real', lastName: 'Person', address: '1 Somewhere St' },
        shipTo: { address: '1 Somewhere St' },
        customer: { email: 'person@example.com' },
      }
    )
    const out = await run.result
    const serialized = JSON.stringify(out)
    expect(out).not.toHaveProperty('billTo')
    expect(out).not.toHaveProperty('shipTo')
    expect(out).not.toHaveProperty('customer')
    expect(serialized).not.toContain('A Real')
    expect(serialized).not.toContain('person@example.com')
    expect(serialized).not.toContain('1 Somewhere St')
    expect(out.invoiceNumber).toBe('INV00001')
  })
})

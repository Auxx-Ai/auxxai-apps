// tests/watches.test.ts

import { beforeEach, describe, expect, it } from 'vitest'
import { InvalidInputError, __resetStorage, __setConnection } from '@auxx/sdk/server'
import {
  MAX_WATCHES,
  addWatch,
  computeExpiresAt,
  listWatches,
  removeWatch,
  updateWatch,
} from '../src/tools/shared/watches'

beforeEach(() => {
  __resetStorage()
  __setConnection({ id: 'conn-1', type: 'secret', value: '', fields: { client_id: 'a', client_secret: 'b' } })
})

describe('addWatch / listWatches', () => {
  it('upserts an entry and lists it back', async () => {
    await addWatch('111', { recordId: 'tkt1', watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    const watches = await listWatches()
    expect(watches).toEqual([
      {
        trackingNumber: '111',
        entry: { recordId: 'tkt1', watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' },
      },
    ])
  })

  it('refreshes an existing entry without duplicating', async () => {
    await addWatch('111', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    await addWatch('111', { watchedAt: '2026-06-13T00:00:00Z', lastKnownStatus: 'out_for_delivery' })
    const watches = await listWatches()
    expect(watches).toHaveLength(1)
    expect(watches[0].entry.lastKnownStatus).toBe('out_for_delivery')
  })

  it('enforces the watch cap for new entries', async () => {
    for (let i = 0; i < MAX_WATCHES; i++) {
      await addWatch(`n${i}`, { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    }
    await expect(
      addWatch('overflow', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    ).rejects.toBeInstanceOf(InvalidInputError)
  })

  it('allows re-watching an existing number even at the cap', async () => {
    for (let i = 0; i < MAX_WATCHES; i++) {
      await addWatch(`n${i}`, { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    }
    await expect(
      addWatch('n0', { watchedAt: '2026-06-13T00:00:00Z', lastKnownStatus: 'delivered' })
    ).resolves.toBeUndefined()
  })
})

describe('removeWatch', () => {
  it('returns true when removing an existing entry', async () => {
    await addWatch('111', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    expect(await removeWatch('111')).toBe(true)
    expect(await listWatches()).toHaveLength(0)
  })

  it('returns false when the number was not watched', async () => {
    expect(await removeWatch('nope')).toBe(false)
  })
})

describe('updateWatch', () => {
  it('persists status without changing membership', async () => {
    await addWatch('111', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    await updateWatch('111', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'delivered' })
    const watches = await listWatches()
    expect(watches).toHaveLength(1)
    expect(watches[0].entry.lastKnownStatus).toBe('delivered')
  })
})

describe('computeExpiresAt', () => {
  it('adds 30 days to watchedAt', () => {
    expect(computeExpiresAt('2026-06-12T00:00:00.000Z')).toBe('2026-07-12T00:00:00.000Z')
  })
})

describe('connection scoping', () => {
  it('keeps watch registries separate per connection', async () => {
    __setConnection({ id: 'conn-A', type: 'secret', value: '', fields: { client_id: 'a', client_secret: 'b' } })
    await addWatch('A1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })

    __setConnection({ id: 'conn-B', type: 'secret', value: '', fields: { client_id: 'a', client_secret: 'b' } })
    expect(await listWatches()).toHaveLength(0)
    await addWatch('B1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    expect((await listWatches()).map((w) => w.trackingNumber)).toEqual(['B1'])
  })
})

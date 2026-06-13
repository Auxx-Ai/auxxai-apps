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

const conn = (id: string) => ({ id, type: 'oauth2-code', value: 'tok', fields: {} })

beforeEach(() => {
  __resetStorage()
  __setConnection(conn('conn-1'))
})

describe('addWatch / listWatches', () => {
  it('upserts an entry and lists it back', async () => {
    await addWatch('1Z1', {
      recordId: 'tkt1',
      watchedAt: '2026-06-12T00:00:00Z',
      lastKnownStatus: 'in_transit',
    })
    expect(await listWatches()).toEqual([
      {
        trackingNumber: '1Z1',
        entry: { recordId: 'tkt1', watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' },
      },
    ])
  })

  it('refreshes an existing entry without duplicating', async () => {
    await addWatch('1Z1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    await addWatch('1Z1', { watchedAt: '2026-06-13T00:00:00Z', lastKnownStatus: 'delivered' })
    const watches = await listWatches()
    expect(watches).toHaveLength(1)
    expect(watches[0].entry.lastKnownStatus).toBe('delivered')
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
    await addWatch('1Z1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    expect(await removeWatch('1Z1')).toBe(true)
    expect(await listWatches()).toHaveLength(0)
  })

  it('returns false when the number was not watched', async () => {
    expect(await removeWatch('nope')).toBe(false)
  })
})

describe('updateWatch', () => {
  it('persists status without changing membership', async () => {
    await addWatch('1Z1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    await updateWatch('1Z1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'delivered' })
    const watches = await listWatches()
    expect(watches).toHaveLength(1)
    expect(watches[0].entry.lastKnownStatus).toBe('delivered')
  })
})

describe('computeExpiresAt', () => {
  it('adds 14 days to watchedAt', () => {
    expect(computeExpiresAt('2026-06-12T00:00:00.000Z')).toBe('2026-06-26T00:00:00.000Z')
  })
})

describe('connection scoping', () => {
  it('keeps watch registries separate per connection', async () => {
    __setConnection(conn('conn-A'))
    await addWatch('A1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })

    __setConnection(conn('conn-B'))
    expect(await listWatches()).toHaveLength(0)
    await addWatch('B1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    expect((await listWatches()).map((w) => w.trackingNumber)).toEqual(['B1'])
  })
})

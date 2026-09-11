// tests/trigger-tracking-changed.test.ts

/**
 * `shipstation.tracking-changed`: silent seeding on first sighting, per-parcel
 * diffing, the terminal skip-set, the status filter and the per-poll request
 * budget.
 *
 * `shipstationApi` is mocked, so no network is reached.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/tools/shared/shipstation-api', () => ({
  shipstationApi: vi.fn(),
}))

import { shipstationApi } from '../src/tools/shared/shipstation-api'
import execute from '../src/triggers/tracking-changed/tracking-changed.server'

const api = shipstationApi as unknown as ReturnType<typeof vi.fn>

function tracking(statusCode: string, extra: Record<string, unknown> = {}) {
  return {
    tracking_number: 'TRACK-1',
    carrier_code: 'fedex',
    status_code: statusCode,
    status_description: statusCode,
    events: [
      {
        occurred_at: '2026-09-10T08:00:00.000Z',
        city_locality: 'AUSTIN',
        state_province: 'TX',
        country_code: 'US',
      },
    ],
    ...extra,
  }
}

const polling = (state: Record<string, unknown> = {}) => ({
  state,
  connection: { value: 'test-api-key' },
})

/** Answer each lookup from a map keyed by tracking number. */
function byNumber(map: Record<string, unknown>) {
  api.mockImplementation(
    async (_endpoint: string, _key: string, query: { tracking_number: string }) => {
      const hit = map[query.tracking_number]
      if (hit === undefined) throw new Error(`no fixture for ${query.tracking_number}`)
      if (hit instanceof Error) throw hit
      return hit
    }
  )
}

beforeEach(() => {
  api.mockReset()
})

describe('tracking-changed execute', () => {
  it('skips the API entirely when nothing is configured', async () => {
    const result = await execute({}, polling())
    expect(result.events).toEqual([])
    expect(api).not.toHaveBeenCalled()
  })

  it('parses a comma/newline-separated list and dedupes', async () => {
    byNumber({ '111': tracking('IT'), '222': tracking('IT') })

    await execute({ trackingNumbers: '111, 222\n111' }, polling())

    const sent = api.mock.calls.map(
      (call) => (call[2] as { tracking_number: string }).tracking_number
    )
    expect(sent).toEqual(['111', '222'])
  })

  it('seeds silently on first sighting and fires on the next transition', async () => {
    byNumber({ '111': tracking('IT') })
    const first = await execute({ trackingNumbers: '111' }, polling())

    expect(first.events).toEqual([])
    expect(first.state.lastStatusByNumber).toEqual({ '111': 'IT' })

    byNumber({ '111': tracking('AT') })
    const second = await execute({ trackingNumbers: '111' }, polling(first.state))

    expect(second.events).toHaveLength(1)
    expect(second.events[0]).toMatchObject({
      trackingNumber: '111',
      previousStatus: 'IT',
      status: 'AT',
      location: 'AUSTIN, TX, US',
    })
  })

  it('sends the carrier code with the lookup', async () => {
    byNumber({ '111': tracking('IT') })

    await execute({ trackingNumbers: '111', carrierCode: ' fedex ' }, polling())

    expect(api.mock.calls[0][0]).toBe('/tracking')
    expect(api.mock.calls[0][2]).toEqual({ carrier_code: 'fedex', tracking_number: '111' })
  })

  it('stops polling a delivered parcel on the next run', async () => {
    byNumber({ '111': tracking('IT') })
    const seeded = await execute({ trackingNumbers: '111' }, polling())

    byNumber({ '111': tracking('DE', { actual_delivery_date: '2026-09-10T09:00:00.000Z' }) })
    const delivered = await execute({ trackingNumbers: '111' }, polling(seeded.state))

    expect(delivered.events).toHaveLength(1)
    expect(delivered.events[0]).toMatchObject({ status: 'DE', isDelivered: true })
    expect(delivered.state.terminal).toEqual(['111'])

    api.mockClear()
    const after = await execute({ trackingNumbers: '111' }, polling(delivered.state))
    expect(api).not.toHaveBeenCalled()
    expect(after.events).toEqual([])
  })

  it('treats a return to sender as terminal', async () => {
    byNumber({ '111': tracking('IT') })
    const seeded = await execute({ trackingNumbers: '111' }, polling())

    byNumber({ '111': tracking('EX', { status_detail_code: 'RETURN_TO_SENDER' }) })
    const returned = await execute({ trackingNumbers: '111' }, polling(seeded.state))

    expect(returned.events[0]).toMatchObject({ isReturned: true })
    expect(returned.state.terminal).toEqual(['111'])
  })

  it('preserves the last-seen status when a lookup fails', async () => {
    byNumber({ '111': tracking('IT') })
    const seeded = await execute({ trackingNumbers: '111' }, polling())

    byNumber({ '111': new Error('upstream is down') })
    const failed = await execute({ trackingNumbers: '111' }, polling(seeded.state))

    expect(failed.events).toEqual([])
    expect(failed.state.lastStatusByNumber).toEqual({ '111': 'IT' })
  })

  it('honours the status filter', async () => {
    byNumber({ '111': tracking('IT') })
    const seeded = await execute({ trackingNumbers: '111', statusCodes: ['DE'] }, polling())

    byNumber({ '111': tracking('AT') })
    const filtered = await execute(
      { trackingNumbers: '111', statusCodes: ['DE'] },
      polling(seeded.state)
    )

    expect(filtered.events).toEqual([])
    // The status is still recorded, so the delivery transition still fires.
    expect(filtered.state.lastStatusByNumber).toEqual({ '111': 'AT' })
  })

  it('budgets requests and rotates the window across polls', async () => {
    const numbers = Array.from({ length: 30 }, (_, i) => `T${i}`)
    api.mockImplementation(
      async (_endpoint: string, _key: string, query: { tracking_number: string }) =>
        tracking('IT', { tracking_number: query.tracking_number })
    )

    const first = await execute({ trackingNumbers: numbers.join(',') }, polling())
    expect(api).toHaveBeenCalledTimes(25)
    expect(first.state.nextIndex).toBe(25)

    api.mockClear()
    const second = await execute({ trackingNumbers: numbers.join(',') }, polling(first.state))
    const sent = api.mock.calls.map(
      (call) => (call[2] as { tracking_number: string }).tracking_number
    )
    // Resumes where it left off rather than re-polling the head forever.
    expect(sent[0]).toBe('T25')
    expect(sent).toHaveLength(25)
    expect(second.events).toEqual([])
  })

  it('drops a tracking number that was removed from the panel', async () => {
    byNumber({ '111': tracking('IT'), '222': tracking('IT') })
    const seeded = await execute({ trackingNumbers: '111,222' }, polling())
    expect(seeded.state.lastStatusByNumber).toEqual({ '111': 'IT', '222': 'IT' })

    byNumber({ '111': tracking('IT') })
    const narrowed = await execute({ trackingNumbers: '111' }, polling(seeded.state))
    expect(narrowed.state.lastStatusByNumber).toEqual({ '111': 'IT' })
  })
})

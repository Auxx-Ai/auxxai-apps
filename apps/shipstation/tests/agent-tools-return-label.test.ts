// tests/agent-tools-return-label.test.ts

/**
 * `create_shipstation_return_label`: the single agent-facing write. The call
 * shape is the assertion, because this one costs money if it is wrong.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/tools/shared/shipstation-api', () => ({ shipstationApi: vi.fn() }))
vi.mock('../src/tools/shared/connection', () => ({
  getShipstationApiKey: () => 'test-api-key',
}))

import { shipstationApi } from '../src/tools/shared/shipstation-api'
import createShipstationReturnLabel from '../src/tools/create-shipstation-return-label.tool.server'

const api = shipstationApi as unknown as ReturnType<typeof vi.fn>

const returnLabel = {
  label_id: 'se-197559999',
  status: 'completed',
  shipment_id: 'se-428778294',
  carrier_code: 'fedex',
  service_code: 'fedex_ground',
  tracking_number: '770000000099',
  is_return_label: true,
  voided: false,
  created_at: '2026-09-11T10:00:00.000Z',
  shipment_cost: { currency: 'usd', amount: 14.62 },
  label_download: {
    href: 'https://api.shipstation.com/v2/downloads/10/abc/label.pdf',
    pdf: 'https://api.shipstation.com/v2/downloads/10/abc/label.pdf',
  },
  packages: [{ package_id: 158414099, sequence: 1, tracking_number: '770000000099' }],
}

beforeEach(() => {
  api.mockReset()
})

describe('the request', () => {
  it('POSTs to the outbound label return path with an empty body by default', async () => {
    api.mockResolvedValue(returnLabel)

    await createShipstationReturnLabel({ labelId: 'se-197559213' })

    expect(api).toHaveBeenCalledTimes(1)
    expect(api).toHaveBeenCalledWith({
      endpoint: '/labels/se-197559213/return',
      apiKey: 'test-api-key',
      method: 'POST',
      body: {},
    })
  })

  it('sends only the print options the caller set', async () => {
    api.mockResolvedValue(returnLabel)

    await createShipstationReturnLabel({
      labelId: 'se-197559213',
      labelFormat: 'pdf',
      labelLayout: '4x6',
    })

    expect(api.mock.calls[0]?.[0]).toMatchObject({
      body: { label_format: 'pdf', label_layout: '4x6' },
    })
  })

  it('never asks for an inline label, which would be base64 in the answer', async () => {
    api.mockResolvedValue(returnLabel)

    await createShipstationReturnLabel({ labelId: 'se-197559213', labelFormat: 'png' })

    const body = (api.mock.calls[0]?.[0] as { body: Record<string, unknown> }).body
    expect(body).not.toHaveProperty('label_download_type')
  })

  it('escapes the label id', async () => {
    api.mockResolvedValue(returnLabel)

    await createShipstationReturnLabel({ labelId: 'se-1/../labels' })

    expect(api.mock.calls[0]?.[0]).toMatchObject({
      endpoint: '/labels/se-1%2F..%2Flabels/return',
    })
  })
})

describe('the result', () => {
  it('projects the new label and its download links', async () => {
    api.mockResolvedValue(returnLabel)

    const result = await createShipstationReturnLabel({ labelId: 'se-197559213' })

    expect(result.label.labelId).toBe('se-197559999')
    expect(result.label.isReturnLabel).toBe(true)
    expect(result.label.masterTrackingNumber).toBe('770000000099')
    expect(result.label.packages[0]?.isMaster).toBe(true)
    expect(result.downloadUrl).toBe('https://api.shipstation.com/v2/downloads/10/abc/label.pdf')
    expect(result.pdfUrl).toBe('https://api.shipstation.com/v2/downloads/10/abc/label.pdf')
    expect(result.pngUrl).toBeNull()
    expect(result.shipmentCost).toEqual({ currency: 'usd', amount: 14.62 })
    expect(result.summary).toContain('se-197559999')
    expect(result.summary).toContain('770000000099')
  })

  it('fills labelStatus from `status`, which is where V2 actually reports it', async () => {
    api.mockResolvedValue(returnLabel)

    const result = await createShipstationReturnLabel({ labelId: 'se-197559213' })

    expect(result.label.labelStatus).toBe('completed')
  })

  it('says the label is still processing rather than inventing a URL', async () => {
    api.mockResolvedValue({ ...returnLabel, label_download: null, shipment_cost: null })

    const result = await createShipstationReturnLabel({ labelId: 'se-197559213' })

    expect(result.downloadUrl).toBeNull()
    expect(result.shipmentCost).toBeNull()
    expect(result.summary).toContain('still be processing')
  })
})

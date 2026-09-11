// tests/project-label-record.test.ts

/**
 * The label -> source-record projection.
 *
 * Both fixtures are the live probe's own cases
 * (`plans/apps/shipstation/api-probe-2026-09-10.md`), reproduced rather than
 * invented: the three-box label whose master is returned LAST, and the
 * void/replacement pair that shares one shipment id. Tracking numbers are fake;
 * the probe only ever printed SHA-256 fingerprints.
 */

import { describe, expect, it } from 'vitest'
import {
  type RawConnectorLabel,
  isLabelVoided,
  projectLabelRecord,
} from '../src/shipstation.connector.server'

/**
 * Probe §2. Packages arrive in sequence order 3, 2, 1, and the MASTER (sequence 1)
 * is the LAST element of the array, which is the fact that makes "index zero is
 * the master" wrong.
 */
const threeBoxLabel: RawConnectorLabel = {
  label_id: 'se-197559213',
  shipment_id: 'se-428778294',
  shipment_number: '14530',
  store_id: 'se-2943015',
  external_shipment_id: '7489518207152-8681743417520',
  external_order_id: '17954843328688',
  carrier_code: 'fedex',
  service_code: 'fedex_home_delivery',
  tracking_number: 'EXAMPLE-TRACKING-0001',
  tracking_status: 'in_transit',
  shipment_status: 'label_purchased',
  voided: false,
  voided_at: null,
  is_return_label: false,
  created_at: '2026-09-10T07:00:00.000Z',
  ship_date: '2026-09-10T07:00:00Z',
  packages: [
    {
      package_id: 158414018,
      sequence: 3,
      tracking_number: 'EXAMPLE-TRACKING-0003',
      weight: { value: 1280, unit: 'ounce' },
      dimensions: { length: 26, width: 50, height: 4, unit: 'inch' },
    },
    {
      package_id: 158414019,
      sequence: 2,
      tracking_number: 'EXAMPLE-TRACKING-0002',
      weight: { value: 464, unit: 'ounce' },
      dimensions: { length: 96, width: 4, height: 4, unit: 'inch' },
    },
    {
      package_id: 158414020,
      sequence: 1,
      tracking_number: 'EXAMPLE-TRACKING-0001',
      weight: { value: 704, unit: 'ounce' },
      dimensions: { length: 71, width: 6, height: 13, unit: 'inch' },
    },
  ],
}

interface ProjectedPackage {
  packageKey: string
  labelId: string
  trackingNumber: string | null
  sequence: number | null
  isMaster: boolean
  weight: number | null
  weightUnit: string | null
  length: number | null
  width: number | null
  height: number | null
  dimUnit: string | null
  voided: boolean
  voidedAt: string | null
  providerTrackingStatus: string | null
}

const packagesOf = (record: { fields: Record<string, unknown> }) =>
  record.fields.packages as ProjectedPackage[]

describe('projectLabelRecord, three-box label', () => {
  const record = projectLabelRecord(threeBoxLabel)

  it('keys the record on the label id and names it by the shipment number', () => {
    expect(record.streamKey).toBe('label')
    expect(record.externalId).toBe('se-197559213')
    expect(record.displayName).toBe('14530')
  })

  it('emits every box, never just the master', () => {
    expect(packagesOf(record)).toHaveLength(3)
    expect(record.fields.parcelCount).toBe(3)
  })

  it('identifies the master by sequence 1, not by array position', () => {
    const masters = packagesOf(record).filter((p) => p.isMaster)
    expect(masters).toHaveLength(1)
    expect(masters[0].sequence).toBe(1)
    expect(masters[0].packageKey).toBe('se-197559213:158414020')
    // The master was the LAST element of the provider's array. If anything read
    // index zero it would have picked the sequence-3 box.
    expect(threeBoxLabel.packages?.[0].sequence).toBe(3)
  })

  it('composes a label-scoped parcel identity and never coerces an id to a number', () => {
    expect(packagesOf(record).map((p) => p.packageKey)).toEqual([
      'se-197559213:158414020',
      'se-197559213:158414019',
      'se-197559213:158414018',
    ])
    for (const pkg of packagesOf(record)) {
      expect(typeof pkg.packageKey).toBe('string')
      expect(pkg.labelId).toBe('se-197559213')
    }
  })

  it('keeps each box distinct, with three different tracking numbers', () => {
    const numbers = packagesOf(record).map((p) => p.trackingNumber)
    expect(new Set(numbers).size).toBe(3)
  })

  it('emits weights in ounces and dimensions in inches, unconverted, with their units', () => {
    const master = packagesOf(record).find((p) => p.sequence === 1)!
    expect(master.weight).toBe(704)
    expect(master.weightUnit).toBe('ounce')
    expect(master.length).toBe(71)
    expect(master.width).toBe(6)
    expect(master.height).toBe(13)
    expect(master.dimUnit).toBe('inch')
    // The heaviest box is 1280 oz; nothing is scaled into pounds or kilograms.
    expect(
      packagesOf(record)
        .map((p) => p.weight)
        .sort((a, b) => (a ?? 0) - (b ?? 0))
    ).toEqual([464, 704, 1280])
  })

  it('carries the shipment structure through, and the LABEL ship date', () => {
    expect(record.fields.shipmentId).toBe('se-428778294')
    expect(record.fields.shipmentNumber).toBe('14530')
    expect(record.fields.storeId).toBe('se-2943015')
    expect(record.fields.externalShipmentId).toBe('7489518207152-8681743417520')
    expect(record.fields.externalOrderId).toBe('17954843328688')
    expect(record.fields.carrier).toBe('fedex')
    expect(record.fields.service).toBe('fedex_home_delivery')
    // The label's `07:00:00Z`, not the shipment's `00:00:00Z`.
    expect(record.fields.shipDate).toBe('2026-09-10T07:00:00Z')
  })

  it('normalizes the shipment status and never derives it from tracking_status', () => {
    // `label_purchased` -> `label_created`. The label's own `tracking_status` is
    // `in_transit`, and it must not become the shipment's status: probe §3 found
    // that value disagreeing with the carrier's own `/track` answer.
    expect(record.fields.shipmentStatus).toBe('label_created')
    expect(record.fields.providerTrackingStatus).toBe('in_transit')
  })

  it('copies the label tracking status down onto each box as provenance', () => {
    for (const pkg of packagesOf(record)) {
      expect(pkg.providerTrackingStatus).toBe('in_transit')
      expect(pkg.voided).toBe(false)
      expect(pkg.voidedAt).toBeNull()
    }
  })

  it('falls back to tracking-number equality when no box carries a sequence', () => {
    const noSequence: RawConnectorLabel = {
      ...threeBoxLabel,
      packages: threeBoxLabel.packages?.map(({ sequence, ...rest }) => rest),
    }
    const masters = packagesOf(projectLabelRecord(noSequence)).filter((p) => p.isMaster)
    expect(masters).toHaveLength(1)
    expect(masters[0].trackingNumber).toBe('EXAMPLE-TRACKING-0001')
  })

  it('refuses to synthesise a parcel identity when a package id is missing', () => {
    const broken: RawConnectorLabel = {
      ...threeBoxLabel,
      packages: [{ sequence: 1, tracking_number: 'EXAMPLE-TRACKING-0001' }],
    }
    expect(() => projectLabelRecord(broken)).toThrow(/no package_id/)
  })
})

/**
 * Probe §3. Shipment `se-426507931` carries two labels: `se-196479007`, voided
 * two minutes after creation, and `se-196479653`, its active replacement. They
 * share the shipment id and the external shipment id.
 */
const voidedLabel: RawConnectorLabel = {
  label_id: 'se-196479007',
  shipment_id: 'se-426507931',
  shipment_number: '14488',
  store_id: 'se-2943015',
  carrier_code: 'fedex',
  service_code: 'fedex_home_delivery',
  tracking_number: 'EXAMPLE-TRACKING-VOID',
  // ⚠️ A voided label still reports `in_transit`. That is the observed payload,
  // not a mistake in the fixture, and it is why nothing here reads delivery out
  // of this field.
  tracking_status: 'in_transit',
  shipment_status: 'label_purchased',
  voided: true,
  voided_at: '2026-09-08T22:52:25.177Z',
  created_at: '2026-09-08T22:50:32.873Z',
  ship_date: '2026-09-08T07:00:00Z',
  packages: [
    {
      package_id: 158000001,
      sequence: 1,
      tracking_number: 'EXAMPLE-TRACKING-VOID',
      weight: { value: 300, unit: 'ounce' },
      dimensions: { length: 10, width: 10, height: 10, unit: 'inch' },
    },
  ],
}

const replacementLabel: RawConnectorLabel = {
  ...voidedLabel,
  label_id: 'se-196479653',
  tracking_number: 'EXAMPLE-TRACKING-LIVE',
  voided: false,
  voided_at: null,
  created_at: '2026-09-08T22:52:48.923Z',
  packages: [
    {
      package_id: 158000002,
      sequence: 1,
      tracking_number: 'EXAMPLE-TRACKING-LIVE',
      weight: { value: 300, unit: 'ounce' },
      dimensions: { length: 10, width: 10, height: 10, unit: 'inch' },
    },
  ],
}

describe('projectLabelRecord, the void and replacement pair on one shipment', () => {
  const voidRecord = projectLabelRecord(voidedLabel)
  const liveRecord = projectLabelRecord(replacementLabel)

  it('gives the two labels separate record identities on the same shipment', () => {
    expect(voidRecord.externalId).toBe('se-196479007')
    expect(liveRecord.externalId).toBe('se-196479653')
    expect(voidRecord.fields.shipmentId).toBe('se-426507931')
    expect(liveRecord.fields.shipmentId).toBe('se-426507931')
  })

  it('emits shipment structure ONLY from the live label', () => {
    // Both records land on the same shipment row. If the voided one carried
    // these values, which label won would depend on page order.
    for (const key of [
      'shipmentNumber',
      'carrier',
      'service',
      'shipDate',
      'parcelCount',
      'shipmentStatus',
    ]) {
      expect(voidRecord.fields[key]).toBeUndefined()
      expect(liveRecord.fields[key]).toBeDefined()
    }
    expect(liveRecord.fields.shipmentStatus).toBe('label_created')
  })

  it('still emits the voided label parcels, flagged voided', () => {
    const voidPackages = packagesOf(voidRecord)
    expect(voidPackages).toHaveLength(1)
    expect(voidPackages[0].packageKey).toBe('se-196479007:158000001')
    expect(voidPackages[0].voided).toBe(true)
    expect(voidPackages[0].voidedAt).toBe('2026-09-08T22:52:25.177Z')
    expect(voidRecord.fields.labelVoided).toBe(true)
    expect(voidRecord.fields.labelVoidedAt).toBe('2026-09-08T22:52:25.177Z')

    const livePackages = packagesOf(liveRecord)
    expect(livePackages[0].packageKey).toBe('se-196479653:158000002')
    expect(livePackages[0].voided).toBe(false)
    expect(liveRecord.fields.labelVoided).toBe(false)
  })

  it('keeps the two labels parcels apart rather than rewriting the old box', () => {
    expect(packagesOf(voidRecord)[0].packageKey).not.toBe(packagesOf(liveRecord)[0].packageKey)
    expect(packagesOf(voidRecord)[0].labelId).toBe('se-196479007')
    expect(packagesOf(liveRecord)[0].labelId).toBe('se-196479653')
  })
})

describe('isLabelVoided', () => {
  it('believes the boolean', () => {
    expect(isLabelVoided(voidedLabel)).toBe(true)
    expect(isLabelVoided(replacementLabel)).toBe(false)
  })

  it('also believes label_status when it says voided', () => {
    // Probe §3 found `label_status` null on live list and get responses, so it
    // cannot be relied on alone, but when it does speak, it is believed.
    expect(isLabelVoided({ ...replacementLabel, label_status: 'voided' })).toBe(true)
    expect(isLabelVoided({ ...replacementLabel, label_status: null as unknown as string })).toBe(
      false
    )
  })
})

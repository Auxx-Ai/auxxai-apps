// src/blocks/ups/constants.ts

/**
 * Resource / operation taxonomy for the UPS workflow block. One resource
 * (`shipment`) in v2; the structure mirrors the fedex/gog-calendar/shopify
 * blocks so adding `rate` / `address` resources later is additive.
 *
 * UPS Tracking v1 has no reference endpoint, so there is no `trackByReference`
 * op (the FedEx block has one).
 */

export const RESOURCES = [{ value: 'shipment', label: 'Shipment' }] as const

export const OPERATIONS = {
  shipment: [
    { value: 'track', label: 'Track by number' },
    { value: 'watch', label: 'Watch shipment' },
    { value: 'unwatch', label: 'Unwatch shipment' },
  ],
} as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  shipment: ['track', 'watch', 'unwatch'],
}

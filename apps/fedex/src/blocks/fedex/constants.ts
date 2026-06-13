// src/blocks/fedex/constants.ts

/**
 * Resource / operation taxonomy for the FedEx workflow block. One resource
 * (`shipment`) in v2; the structure mirrors the gog-calendar/shopify blocks so
 * adding `rate` / `ship` resources later is additive.
 */

export const RESOURCES = [{ value: 'shipment', label: 'Shipment' }] as const

export const OPERATIONS = {
  shipment: [
    { value: 'track', label: 'Track by number' },
    { value: 'trackByReference', label: 'Track by reference' },
    { value: 'watch', label: 'Watch shipment' },
    { value: 'unwatch', label: 'Unwatch shipment' },
  ],
} as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  shipment: ['track', 'trackByReference', 'watch', 'unwatch'],
}

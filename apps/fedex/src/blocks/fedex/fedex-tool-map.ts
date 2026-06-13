// src/blocks/fedex/fedex-tool-map.ts

/**
 * Dispatch table — `${resource}.${operation}` → internal block tool id. The
 * build extractor reads this literal at compile time and projects it into the
 * catalog envelope so the runtime can validate dispatches.
 */

export const fedexToolMap = {
  'shipment.track': 'fedex_block_track',
  'shipment.trackByReference': 'fedex_block_track_by_reference',
  'shipment.watch': 'fedex_block_watch',
  'shipment.unwatch': 'fedex_block_unwatch',
} as const

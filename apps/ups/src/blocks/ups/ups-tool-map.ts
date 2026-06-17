// src/blocks/ups/ups-tool-map.ts

/**
 * Dispatch table — `${resource}.${operation}` → internal block tool id. The
 * build extractor reads this literal at compile time and projects it into the
 * catalog envelope so the runtime can validate dispatches.
 */

export const upsToolMap = {
  'shipment.track': 'ups_block_track',
  'shipment.watch': 'ups_block_watch',
  'shipment.unwatch': 'ups_block_unwatch',
} as const

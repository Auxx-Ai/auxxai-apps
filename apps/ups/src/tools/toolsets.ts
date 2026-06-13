// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * One toolset for all UPS tracking tools. No read/write split — watch and
 * unwatch only mutate our own registry, never anything at UPS, so there's no
 * sensitive write to gate separately.
 */
export const upsToolsets: Toolset[] = [
  {
    id: 'ups.tracking',
    name: 'UPS tracking',
    description: 'Track UPS shipments by number and watch shipments for status changes.',
    tools: ['track_shipment', 'watch_shipment', 'unwatch_shipment', 'list_watched_shipments'],
  },
]

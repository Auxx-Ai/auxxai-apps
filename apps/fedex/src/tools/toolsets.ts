// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * One toolset for all FedEx tracking tools. No read/write split — watch and
 * unwatch only mutate our own registry, never anything at FedEx, so there's no
 * sensitive write to gate separately.
 */
export const fedexToolsets: Toolset[] = [
  {
    id: 'fedex.tracking',
    name: 'FedEx tracking',
    description:
      'Track FedEx shipments by number or reference, and watch shipments for status changes.',
    tools: [
      'track_shipment',
      'track_by_reference',
      'watch_shipment',
      'unwatch_shipment',
      'list_watched_shipments',
    ],
  },
]

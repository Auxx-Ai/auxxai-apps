// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Toolsets are the approval gate an admin uses to grant an agent a group of
 * tools at once. Every tool with an `agent` surface key must list a
 * `toolsetSlug` matching one of these ids, or it is filed under
 * `app:unknown:default` and never appears in the agent picker.
 *
 * These are read-only shipment lookups. They are deliberately not marked
 * externally safe: a tracking number is not authorization to browse the
 * account's other shipments.
 */
export const shipstationToolsets: Toolset[] = [
  {
    id: 'shipstation.read',
    name: 'ShipStation shipments',
    description:
      'Read shipments, labels and every package tracking number, including voided label history.',
    tools: [
      'list_shipstation_carriers',
      'get_shipstation_shipment_packages',
      'get_shipstation_label',
      'list_shipstation_labels',
    ],
  },
]

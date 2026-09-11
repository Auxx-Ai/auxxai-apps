// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Toolsets are the approval gate an admin uses to grant an agent a group of
 * tools at once. Every tool with an `agent` surface key must list a
 * `toolsetSlug` matching one of these ids, or it is filed under
 * `app:unknown:default` and never appears in the agent picker.
 *
 * Neither set is marked externally safe: a tracking number is not
 * authorization to browse the account's other shipments.
 *
 * The two are separate so that granting an agent the ability to LOOK UP a
 * shipment is a different decision from granting it the ability to SPEND
 * money. Everything else write-shaped lives in the workflow block only, where
 * it is additionally gated by the `allowWrites` / `allowLabelPurchase` app
 * settings; see `blocks/shipstation/resources/capabilities.ts`.
 */
export const shipstationToolsets: Toolset[] = [
  {
    id: 'shipstation.read',
    name: 'ShipStation shipments',
    description:
      'Read shipments, labels and every package tracking number, including voided label history, plus live per-parcel carrier tracking.',
    tools: [
      'list_shipstation_carriers',
      'get_shipstation_shipment_packages',
      'get_shipstation_label',
      'list_shipstation_labels',
      'get_shipstation_tracking',
      'list_shipstation_shipments',
      'get_shipstation_shipment',
    ],
  },
  {
    id: 'shipstation.returns',
    name: 'ShipStation returns',
    description:
      'Buy a prepaid return label against an existing outbound label. This spends money, which is why it is a separate grant from the read set.',
    tools: ['create_shipstation_return_label'],
  },
]

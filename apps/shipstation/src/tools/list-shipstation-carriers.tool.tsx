// src/tools/list-shipstation-carriers.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../assets/icon.png'
import listShipstationCarriersExecute from './list-shipstation-carriers.tool.server'

export const listShipstationCarriersTool = defineTool({
  id: 'list_shipstation_carriers',
  name: 'List ShipStation carriers',
  description:
    'List the carrier accounts connected to ShipStation. Useful to discover carrier ids for filtering labels, and as the cheapest check that the ShipStation connection works.',
  icon: shipstationIcon,
  inputs: z.object({}),
  outputs: z.object({
    carriers: z.array(
      z.object({
        carrierId: z.string(),
        carrierCode: z.string().nullable(),
        friendlyName: z.string().nullable(),
        nickname: z.string().nullable(),
      })
    ),
    count: z.number(),
  }),
  exampleOutput: {
    // Shape mirrors a live response: `nickname` is set only where the account
    // named the carrier, and one account can expose several FedEx entries.
    carriers: [
      { carrierId: 'se-3891089', carrierCode: 'usps', friendlyName: 'USPS', nickname: 'Free' },
      { carrierId: 'se-3891373', carrierCode: 'fedex', friendlyName: 'FedEx', nickname: null },
      { carrierId: 'se-3891090', carrierCode: 'ups', friendlyName: 'UPS', nickname: null },
      {
        carrierId: 'se-3891091',
        carrierCode: 'fedex_walleted',
        friendlyName: 'FedEx One Balance',
        nickname: null,
      },
    ],
    count: 4,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 15000 },
  execute: listShipstationCarriersExecute,
  agent: { toolsetSlug: 'shipstation.read' },
})

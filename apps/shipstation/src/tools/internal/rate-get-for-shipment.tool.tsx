// src/tools/internal/rate-get-for-shipment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import rateGetForShipmentExecute from './rate-get-for-shipment.tool.server'

/**
 * `rate.getForShipment` for the ShipStation workflow block. No agent surface.
 *
 * Reads the rates already calculated for an existing shipment, so it is a pure
 * read and creates nothing.
 */
export const rateGetForShipmentTool = defineTool({
  id: 'block_shipstation_rate_get_for_shipment',
  name: 'ShipStation rate getForShipment (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, idempotent: true, timeout: 30000 },
  execute: rateGetForShipmentExecute,
})
